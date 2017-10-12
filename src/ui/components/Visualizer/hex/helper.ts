export function toHex(value, byteLength = 1) {
  let maxSize = Math.pow(2, byteLength * 8);

  if (value > maxSize) {
    throw new Error(`Cannot display value ${value} with ${byteLength} byte(s)`);
  }

  let pad = "0".repeat(byteLength * 2);

  return `${pad}${value.toString(16)}`.substr(byteLength * -2);
}

export default function(params) {
  return `0x${toHex(params[0], 2)}`;
}