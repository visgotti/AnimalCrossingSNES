import { Angles, DirectionString } from "./Core/types";

const RADIAN_TO_DEGREE_MULTIPLIER = 180 / Math.PI;
const DEGREE_TO_RADIAN_MULTIPLIER = Math.PI / 180;
export function normalizeAxes(x: number, y: number) : { angles?: { default: Angles, north0: Angles }, power: number } {
    if(Math.abs(x) <= .05 && Math.abs(y) <= .05) return { angles: null, power: 0 };
    const radians = Math.atan2(y, x);
    const degrees = radians*RADIAN_TO_DEGREE_MULTIPLIER;
    let north0Degrees = 90 - degrees;
    if(north0Degrees < 0) {
        north0Degrees+=360;
    }
    return {
        angles: {
            default: {
                radians,
                degrees,
            },
            north0: {
                degrees: north0Degrees,
                radians: north0Degrees * DEGREE_TO_RADIAN_MULTIPLIER
            },
        },
        power: Math.max(Math.abs(x) + Math.abs(y)),
    }
}
export function isValidDirection(direction: string) {
    return ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'].includes(direction);
}
export function getDirectionFromNorth0Degrees(degrees) : DirectionString  {
    const rounded = Math.round(degrees/45);
    return rounded > 7 ? 'north' :
        (<Array<DirectionString>>['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'])[rounded];
}