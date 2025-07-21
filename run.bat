@echo off
cd client
start cmd /c npm dev
cd ../server
start cmd /c bun dev
cd ..
@echo on