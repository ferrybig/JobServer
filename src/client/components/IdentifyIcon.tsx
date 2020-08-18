import React, { FC, useRef } from 'react';
import useThemeContext from '../context/themes/useThemeContext';
import useIdleEffect from './hooks/useIdleEffect';

const PIXEL_SIZE = 5;
const CELLS = 8; // Needs to be even!!
const SIZE = PIXEL_SIZE * CELLS;

interface Props {
	hex128: string | null;
	className?: string;
}

function renderCell(x: number, z: number, ctx: CanvasRenderingContext2D, value: number) {
	switch (value) {
		case 0:
			return;
		case 1:
			ctx.globalAlpha = 0.33;
			break;
		case 2:
			ctx.globalAlpha = 0.66;
			break;
		case 3:
			ctx.globalAlpha = 1;
			break;
		default:
			throw new Error('Invalid value: ' + value);
	}
	ctx.fillRect(x * PIXEL_SIZE, z * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
}

const IdentifyIcon: FC<Props> = ({
	hex128,
	...rest
}): JSX.Element => {
	// 8x8 bits for the grid, 2 bit color depth
	const canvas = useRef<HTMLCanvasElement>(null);
	const [theme] = useThemeContext();
	useIdleEffect(() => {
		const canvasElement = canvas.current;
		if (!canvasElement || !hex128) {
			return;
		}
		if (!hex128.match(/^[0-9a-f]{32}$/i)) {
			console.warn('Expected hex128 to be a 32 length hex string (128 bit)', hex128);
		}
		const currentStyle = getComputedStyle(canvasElement);
		const background = currentStyle.getPropertyValue('--identify-icon--bg') || 'purple';
		const foreground = currentStyle.getPropertyValue('--identify-icon--fg') || 'green';
		const ctx = canvasElement.getContext('2d');
		if (!ctx) {
			console.warn('Browser does not support 2d canvas??');
			return;
		}
		ctx.globalAlpha = 1;
		ctx.fillStyle = background;
		ctx.fillRect(0, 0, SIZE, SIZE);
		ctx.fillStyle = foreground;
		console.log({
			background,
			foreground,
		});
		for (let z = 0; z < CELLS; z++) {
			for (let x = 0; x < CELLS; x+=2) {
				// x and CELLS need to stay even here!
				const char = hex128[(z * CELLS + x) / 2] ?? `${z * 2 + (x < 4 ? 0 : 1)}`;
				const parsed = Number.parseInt(char, 16);
				if (Number.isNaN(parsed) || parsed < 0 || parsed > 15) {
					console.warn('Invalid number ecountered!!', parsed, char, hex128[(z * CELLS + x) / 2], hex128);
					continue;
				}
				const a = parsed & 0b11;
				const b = parsed >> 2;
				renderCell(x, z, ctx, a);
				renderCell(x + 1, z, ctx, b);
			}
		}
	}, [canvas, theme, canvas]);

	return (
		<canvas width={SIZE} height={SIZE} ref={canvas} {...rest}/>
	);
};

export default IdentifyIcon;

export const IdentifyIconByHumanUUID: FC<{uuid: string | null} & Omit<Props, 'hex128'>> = ({ uuid, ...rest }) => {
	return (
		<IdentifyIcon hex128={uuid ? uuid.replace(/-/g, '') : null} {...rest}/>
	);
};
