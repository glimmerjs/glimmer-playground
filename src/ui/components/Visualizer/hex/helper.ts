export default function(params) {
  let value = params[0];
  let padded = `0${value.toString(16)}`.substr(-2);
  return `0x${padded}`;
}