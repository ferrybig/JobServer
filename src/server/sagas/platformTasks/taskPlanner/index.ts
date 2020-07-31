import {SagaIterator} from "redux-saga";
import deploymentTaskPlanner from "./deploymentTaskPlanner";
import {fork} from "redux-saga/effects";

export default function* taskPlanner(): SagaIterator {
	yield fork(deploymentTaskPlanner);
}
