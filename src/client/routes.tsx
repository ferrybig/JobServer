import React from 'react';
import route from "./components/minirouter/route";

function Debug(props: Record<string, any>) {
	return <pre>{JSON.stringify(props, null, 4)}</pre>;
}

export const home = route`/`().component(() => <span>home</span>);
export const deploymentInformationSingle = route`/deploymentInformation/${'id'}/`().component((props) => <span>deploymentInformation<Debug {...props}/></span>);
export const deploymentInformation = route`/deploymentInformation/`().component((props) => <span>deploymentInformation<Debug {...props}/></span>);
export const test = route`/test/${'a'}${'b'}${'c'}${'d'}/`().component((props) => <span>deploymentInformation<Debug {...props}/></span>);
