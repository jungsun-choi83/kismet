declare module 'lunar-javascript' {
  export const Solar: {
    fromYmdHms: (y: number, m: number, d: number, h: number, min: number, s: number) => {
      getLunar: () => { getEightChar: () => { getYear: () => string; getMonth: () => string; getDay: () => string; getTime: () => string } }
    }
  }
  export const Lunar: {
    fromYmdHms: (y: number, m: number, d: number, h: number, min: number, s: number) => {
      getSolar: () => ReturnType<typeof Solar.fromYmdHms>
    }
  }
}
