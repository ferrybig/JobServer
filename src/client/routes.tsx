import {route} from "./components/minirouter/makeRouter";

export const home = route`/`().component(() => <span>home</span>)