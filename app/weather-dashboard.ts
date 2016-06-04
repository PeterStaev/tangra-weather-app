import { EventData } from "data/observable";
import { Page } from "ui/page";
import { WeatherDashboardModel } from "./weather-dashboard-model";

let model = new WeatherDashboardModel();

export function navigatingTo(args: EventData) {
    var page = <Page>args.object;
    page.bindingContext = model;
    model.loadWeatherData();
}