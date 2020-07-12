Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/bionic64"
  config.vm.hostname = "express-api-passport-local-mongo-session-example"
  config.vm.provision "shell", path: "vagrant-manifests/setup.sh"
  config.vm.provision "shell", path: "vagrant-manifests/environment.sh"
  config.vm.network "forwarded_port", guest: 3000, host: 3000
end
