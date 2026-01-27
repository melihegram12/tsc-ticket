import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";
import { initSocketServer } from "@/lib/socket";

export const config = {
    api: {
        bodyParser: false,
    },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponse) => {
    if (!(res.socket as any).server.io) {
        console.log("*First use, starting socket.io");
        const httpServer: NetServer = (res.socket as any).server as any;
        initSocketServer(httpServer);
    } else {
        console.log("Socket.io already running");
    }
    res.end();
};

export default ioHandler;
