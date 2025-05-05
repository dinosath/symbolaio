#!/bin/sh
envsubst '$REGISTRY_API_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

nginx -g "daemon off;"