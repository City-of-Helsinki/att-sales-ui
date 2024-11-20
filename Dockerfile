# ===============================================
FROM public.ecr.aws/docker/library/node:16-slim as appbase
# ===============================================

WORKDIR /app

# Copy package.json and package-lock.json/yarn.lock files
COPY package*.json ./

# Install dependencies
RUN npm install


# =============================
FROM appbase as development
# =============================
# Copy all files
COPY . .
CMD ["npm", "start"]


#==============================
FROM appbase as staticbuilder
#==============================
COPY . /app
RUN npm run build


# ============================================================
FROM registry.access.redhat.com/ubi8/nginx-120 as production
# =============================================================
# Copy static build
COPY --from=staticbuilder /app/build /usr/share/nginx/html

# Copy nginx config
COPY ./.prod/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8000
CMD ["nginx", "-g", "daemon off;"]
