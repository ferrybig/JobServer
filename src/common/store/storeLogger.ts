import {Middleware} from "redux";
import { createLogger } from 'redux-logger'

export default function storeLogger() {
	return createLogger({});
}