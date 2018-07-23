PORT = 3000

Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/xenial64"

  config.vm.provider "virtualbox" do |vb|
    vb.name = "express-api-passport-local-mongo-session-example"
    vb.memory = 1024
    vb.customize ["modifyvm", :id, "--uartmode1", "disconnected"]
  end

  config.vm.hostname = "express-api-passport-local-mongo-session-example"

  config.vm.provision "shell", path: "vagrant-manifests/setup.sh", env: {
    "PORT" => PORT,
    "MONGODB_URI" => "mongodb://localhost:27017/example"
  }

  config.vm.network "forwarded_port", guest: PORT, host: PORT
end
