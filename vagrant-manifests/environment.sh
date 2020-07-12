#!/usr/bin/env bash

echo "Set environment variables"
cat > /home/vagrant/.bash_profile << EOF
# .bash_profile

# Get the aliases and functions
if [ -f ~/.bashrc ]; then
	. ~/.bashrc
fi

# User specific environment and startup programs
PATH=$PATH:$HOME/.local/bin:$HOME/bin
export PATH

# Set environment variables
export MONGODB_URI="mongodb://localhost:27017/example"
export PORT=3000

EOF