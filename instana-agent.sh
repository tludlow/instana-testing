#!/bin/bash

sudo docker run \
   --detach \
   --name instana-agent \
   --volume /var/run:/var/run \
   --volume /run:/run \
   --volume /dev:/dev:ro \
   --volume /sys:/sys:ro \
   --volume /var/log:/var/log:ro \
   --privileged \
   --net=host \
   --pid=host \
   --env="INSTANA_AGENT_ENDPOINT=ingress-red-saas.instana.io" \
   --env="INSTANA_AGENT_ENDPOINT_PORT=443" \
   --env="INSTANA_AGENT_KEY=J8WrVA6DReCs_Vuu_u6GcA" \
   --env="INSTANA_DOWNLOAD_KEY=J8WrVA6DReCs_Vuu_u6GcA" \
   icr.io/instana/agent