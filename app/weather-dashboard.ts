import { EventData } from "data/observable";
import { Page } from "ui/page";
import { WeatherDashboardModel } from "./weather-dashboard-model";
import * as statusBar from "nativescript-status-bar";

let model = new WeatherDashboardModel();

export function navigatingTo(args: EventData) {
    statusBar.hide();
    
    var page = <Page>args.object;
    page.bindingContext = model;
    model.loadWeatherData();
}