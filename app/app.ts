import * as application from "application";
import * as moment from "moment";

application.resources.dateFormat = (value: Date, format: string) => {
    return moment(value).format(format);
};

application.start({ moduleName: "weather-dashboard" });
