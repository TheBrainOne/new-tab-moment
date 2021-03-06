class Weather {

    public static async getWeather(tempUnit: TempUnit, location: string, language: string): Promise<weather> {
        const expiresDate: number = Number(localStorage.getItem("expires"));
        if (expiresDate > Date.now()) {
            return Promise.resolve(this.getFromStorage());
        } else {
            return this.getCurrentWeather(tempUnit, location, language);
        }
    }

    private static async getCurrentWeather(tempUnit: TempUnit, location: string, language: string): Promise<weather> {
        let latitude: number | undefined = undefined;
        let longitude: number | undefined = undefined;

        if (location === "") {
            const position = await new Promise<Position>((resolve, reject) => { navigator.geolocation.getCurrentPosition(resolve, reject); });
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
        }

        return this.weatherAPIRequest(location === "" ? undefined : location, latitude, longitude, tempUnit, language);
    }

    private static async weatherAPIRequest(location: string | undefined, latitude: number | undefined, longitude: number | undefined, tempUnit: TempUnit, language: string): Promise<weather> {
        const apiUrl = this.buildApiUrl({ q: location, lat: latitude, lon: longitude, lang: language.substring(0, 2), units: tempUnit === "celsius" ? "metric" : "imperial" });

        const response = await fetch(apiUrl);
        const weatherData = await response.json();
        const weather: weather = {
            degrees: Math.round(weatherData.main.temp).toString(),
            description: weatherData.weather[0].description,
            link: `https://openweathermap.org/city/${weatherData.id}`,
            code: weatherData.weather[0].id
        };

        this.putInStorage(weather);
        return Promise.resolve(weather);
    }

    private static buildApiUrl(parameters: apiUrlParameters): string {
        const apiUrl: string = "https://api.openweathermap.org/data/2.5/weather?APPID=cfcea063d9248af75b4837959ee2feac&";
        const searchParams = new URLSearchParams();

        Object.entries(parameters).map(([key, val]) => {
            if (val !== undefined) {
                searchParams.append(key, val.toString());
            }
        });
        return apiUrl + searchParams.toString();
    }

    private static putInStorage({ degrees, description, link, code }: weather): void {
        let currentTime: number = Date.now();
        currentTime += 60 * 5000; // 5 min
        const expireDate: Date = new Date(currentTime);
        localStorage.setItem("degrees", degrees);
        localStorage.setItem("weather", description);
        localStorage.setItem("link", link);
        localStorage.setItem("code", code);
        localStorage.setItem("expires", expireDate.getTime().toString());
    }

    private static getFromStorage(): weather {
        return {
            degrees: localStorage.getItem("degrees")! as string,
            description: localStorage.getItem("weather") as string,
            link: localStorage.getItem("link") as string,
            code: localStorage.getItem("code") as string
        };
    }
}

type weather = {
    degrees: string;
    description: string;
    link: string;
    code: string;
}

type apiUnit = "metric" | "imperial";

type apiUrlParameters = {
    q?: string;
    lat?: number;
    lon?: number;
    lang: string;
    units: apiUnit;
}

