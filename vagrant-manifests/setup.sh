#!/usr/bin/env bash

wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | sudo apt-key add -
echo "deb [ arch=amd64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.2.list

curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -

curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

apt-get update
apt-get upgrade -y --allow
apt-get install -y git ntp build-essential mongodb-org nodejs imagemagick libkrb5-dev yarn redis-server
apt-get autoremove -y
apt-get autoclean -y

sudo cp /vagrant/vagrant-manifests/mongodb.service /etc/systemd/system/mongodb.service
sudo systemctl enable mongodb
sudo systemctl start mongodb

sudo npm install -g npm
sudo npm install -g node-gyp
sudo chmod -R 777 /usr/lib/node_modules/

echo "Vagrant Provisioning Done"
