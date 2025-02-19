# syntax=docker/dockerfile:1

ARG NODE_VERSION=23.1.0

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base

# Set working directory for all build stages.
WORKDIR /usr/src/app

################################################################################
# Stage for installing production dependecies.
FROM base AS deps

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage bind mounts to package.json and package-lock.json to avoid having to copy them
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

################################################################################
# Stage for building the application.
FROM deps AS build

# Download additional development dependencies before building, as some projects require
# "devDependencies" to be installed to build. If you don't need this, remove this step.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Copy the rest of the source files into the image.
COPY . .
# Run the build script.
RUN npm run build

################################################################################
# Stage for installing the Azure CLI.
# https://dev.to/sukkergris/install-azure-cli-in-an-alpine-container-4b2e
FROM node:${NODE_VERSION}-alpine AS az-cli

# Install system dependencies, create a virtual environment,
# install Azure CLI, and clean up.
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache --update \
        cargo \
        gcc \
        libffi-dev \
        make \
        musl-dev \
        openssl-dev \
        py3-pip \
        python3 \
        python3-dev \
    && python3 -m venv /opt/venv \
    && . /opt/venv/bin/activate \
    && pip install --upgrade pip \
    && pip install --no-cache-dir azure-cli \
    && deactivate \
    && apk del \
        gcc \
        musl-dev \
        python3-dev \
        libffi-dev \
        openssl-dev \
        cargo \
        make \
    && rm -rf /var/cache/apk/*

# Update PATH to include the virtual environment
ENV PATH="/opt/venv/bin:$PATH"

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
FROM az-cli AS final

# Use production node environment by default.
ENV NODE_ENV=production

# Run the application as a non-root user.
USER node

# Copy package.json so that package manager commands can be used.
COPY package.json .

# Copy the production dependencies from the deps stage and also
# the built application from the build stage into the image.
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Expose the port that the application listens on.
EXPOSE 2929

# Run the application.
CMD ["npm", "start"]
