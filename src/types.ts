export interface RouterStatus {
  online: boolean;
  simulated?: boolean;
  boardName: string;
  version: string;
  cpuLoad: number;
  freeMemory: number;
  totalMemory: number;
  uptime: string;
  rxRate: number | string;
  txRate: number | string;
}

export interface HotspotUser {
  '.id': string;
  name: string;
  profile: string;
  comment?: string;
  disabled?: string;
  uptime?: string;
  bytesIn?: string;
  bytesOut?: string;
  limitUptime?: string;
  limitBytesTotal?: string;
}

export interface ActiveSession {
  '.id': string;
  user: string;
  address: string;
  macAddress?: string;
  mac?: string;
  uptime: string;
  bytesIn?: string;
  bytesOut?: string;
  sessionTimeLeft?: string;
}

export interface SaleTransaction {
  id: string;
  reference: string;
  amount: number;
  plan: string;
  profile: string;
  voucher: string;
  mode: string;
  phone?: string;
  date: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface VoucherItem {
  id: string;
  code: string;
  profile: string;
  price: number;
  created: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  comment?: string;
}

export interface AppSettings {
  routerIp: string;
  routerPort: string;
  routerUser: string;
  routerPass: string;
  fedapayPublicKey: string;
  fedapaySecretKey: string;
  fedapayEnv: 'sandbox' | 'live';
  dnsName: string;
}
