@echo off
cd /d %~dp0
pm2 start bot.js --name bagatracker-bot 