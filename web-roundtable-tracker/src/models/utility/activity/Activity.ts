export type ActivityType<T extends string = "pause" | "resume"| "start"| "stop" | "begin" | "end"> = {
    [key in T]: () => void;
} & {
    readonly [K in `${T}Label`]: string;
} & {
    readonly [K in `${T}Label`]: string;
}