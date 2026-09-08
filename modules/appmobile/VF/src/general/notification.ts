import { EventEmitter } from "events";

export const notificationEmitter = new EventEmitter();

export type Notice = {type: "success" | "error" | "info" | "auth", message: string};

export const notify = (notice: Notice) => {
    notificationEmitter.emit("thong_bao", notice);
};
