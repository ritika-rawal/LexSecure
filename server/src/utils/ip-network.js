import { BlockList, isIP } from 'node:net';

const createInvalidNetworkError = () => {
  const error = new Error('Network must be a valid IPv4 or IPv6 address with an optional CIDR prefix.');
  error.statusCode = 400;
  return error;
};

export const parseIpNetwork = (value) => {
  if (typeof value !== 'string') throw createInvalidNetworkError();

  const parts = value.trim().toLowerCase().split('/');

  if (parts.length > 2 || !parts[0] || parts[0].includes('%')) {
    throw createInvalidNetworkError();
  }

  const address = parts[0];
  const family = isIP(address);

  if (!family) throw createInvalidNetworkError();

  const maximumPrefix = family === 4 ? 32 : 128;
  const prefixLength = parts.length === 1
    ? maximumPrefix
    : Number(parts[1]);

  if (
    !Number.isInteger(prefixLength)
    || (parts.length === 2 && String(prefixLength) !== parts[1])
    || prefixLength < 0
    || prefixLength > maximumPrefix
  ) {
    throw createInvalidNetworkError();
  }

  return Object.freeze({
    address,
    family,
    prefixLength,
    cidr: `${address}/${prefixLength}`,
  });
};

export const createNetworkMatcher = (rules) => {
  const blockList = new BlockList();

  rules.forEach(({ address, family, prefixLength }) => {
    blockList.addSubnet(address, prefixLength, family === 4 ? 'ipv4' : 'ipv6');
  });

  return (address) => {
    const family = isIP(address);
    if (!family) return false;
    return blockList.check(address, family === 4 ? 'ipv4' : 'ipv6');
  };
};
