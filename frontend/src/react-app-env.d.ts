/// <reference types="react-scripts" />
interface Window {
  ym: (id: number, action: string, ...args: any[]) => void;
}