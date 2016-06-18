import * as applicationSettings from "application-settings";

class Settings {

    constructor() {
        if (!applicationSettings.hasKey("unitSystem")) {
            this.unitSystem = "us";
        }
    }
    
    get unitSystem(): string { return applicationSettings.getString("unitSystem"); }
    set unitSystem(value: string) { applicationSettings.setString("unitSystem", value); }
}

export = new Settings();