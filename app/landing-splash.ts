import { EventData } from "data/observable";
import * as statusBar from "nativescript-status-bar";
import * as frame from "ui/frame";
import * as geolocation from "nativescript-geolocation";
import { WeatherDashboardModel } from "./weather-dashboard-model";

let model = new WeatherDashboardModel();

export function pageLoaded(args: EventData) {
    statusBar.hide();

    // Pull data every 500ms and wait until the user allows location services    
    let interval = setInterval(() => {
        if (geolocation.isEnabled()) {
            clearInterval(interval);
            loadRawData();
        }
    }, 500);
    
    if (!geolocation.isEnabled()) {
        geolocation.enableLocationRequest(false);
    }
}

function loadRawData() {
    geolocation.getCurrentLocation({ maximumAge: 10 * 60 * 1000 }).then((value) => {
        model.loadRawData(value.latitude, value.longitude).then(() => {
            frame.topmost().navigate({
                moduleName: "weather-dashboard",
                transition: { name: "fade" },
                clearHistory: true,
                context: model
            } as frame.NavigationEntry);
        });
    });
}