// Homebridge plugin for SkyBell HD video doorbells
// Copyright © 2017, 2020 Alexander Thoukydides

'use strict';

let SkyBellAccount = require('./skybell_account');
let SkyBellAccessory = require('./accessory');
let Webhooks = require('./webhooks');

// Platform identifiers
const PLUGIN_NAME = 'homebridge-skybell';
const PLATFORM_NAME = 'SkyBell';

// Register as a non-dynamic platform
module.exports = homebridge => {
    homebridge.registerPlatform(PLUGIN_NAME, PLATFORM_NAME,
                                SkyBellPlatform, false);
}

// A Homebridge SkyBell platform
class SkyBellPlatform {

    // Create a new SkyBell platform object
    constructor(log, config, homebridge) {
        log('new SkyBellPlatform');
        this.log = log;
        this.config = config || {};
        this.homebridge = homebridge;

        // Enumerate SkyBell devices after cached accessories restored
        if (homebridge) {
            this.homebridge.on('didFinishLaunching',
                               () => this.finishedLaunching());
        } else {
            this.finishedLaunching();
        }
    }

    // Required to indicate support for Plugin 2.0 API, but won't be called
    configureAccessory(accessory) {
        this.log('configureAccessory');
    }
    
    // Update list of SkyBell accessories after cache has been restored
    finishedLaunching() {
        this.log('finishedLaunching');

        // Extract the account credentials from the configuration
        let user = this.config['username'];
        let pass = this.config['password'];
        if (!user) this.log.error('Platform ' + PLATFORM_NAME + " configuration is missing 'username' property");
        if (!pass) this.log.error('Platform ' + PLATFORM_NAME + " configuration is missing 'password' property");
        
        // Connect to the SkyBell cloud
        this.skybellAccount = new SkyBellAccount(user, pass, {
            log:         this.log.debug.bind(this.log),
            callbackAdd: this.addAccessory.bind(this)
        });

        // Start the webhooks server if configured
        if (this.config.port) {
            this.webhooks = new Webhooks(this.config.port, {
                log:     this.log.debug.bind(this.log),
                secret:  this.config.secret
            });
        }
    }

    // Create a new accessory
    addAccessory(skybellDevice) {
        this.log("addAccessory '" + skybellDevice.name + "'");
        let skybell = new SkyBellAccessory(this.log, this.homebridge,
                                           skybellDevice, this.webhooks);
        this.homebridge.publishExternalAccessories(PLUGIN_NAME,
                                                   [skybell.accessory]);
    }
}
