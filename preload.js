'use strict';
// Talar om för verktyget att det körs som skrivbordsprogram (döljer webbläsartips m.m.).
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('ntDesktop', { desktop: true });
