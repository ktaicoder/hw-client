import { firstValueFrom, map, Observable, timeout } from 'rxjs'
import { DeviceCtlResponse, HwSocket } from './HwSocket'

function nextRequestId() {
    return Math.random().toString(36).substring(2) + Date.now()
}

export class HwClient {
    socket: HwSocket

    constructor(websocketUrl: string, public clientType: 'blockcoding' | 'normal') {
        this.socket = new HwSocket(websocketUrl)
    }

    /**
     * 연결 여부 체크
     * @returns 연결 여부
     */
    isConnected = (): boolean => this.socket.isConnected()

    /**
     * 연결 종료 여부 체크
     * @returns 연결 종료 여부
     */
    isDisonnected = (): boolean => this.socket.isDisconnected()

    /**
     * 연결을 시도한다
     */
    connect = () => {
        this.socket.connect()
    }

    /**
     * 연결을 끊는다
     */
    disconnect = () => {
        this.socket.disconnect()
    }

    /**
     * 연결 여부 모니터링
     * @returns 연결 여부 옵저버블
     */
    observeConnected = (): Observable<boolean> => {
        return this.socket.observeState().pipe(map((it) => it === 'connected'))
    }

    /**
     * 연결될 때까지 기다리기
     * @param timeoutMilli 타임아웃 밀리초, 0보다 작으면 타임아웃 없음
     */
    waitForConnected = async (timeoutMilli = 0): Promise<void> => {
        const src$ = this.socket.observeState().pipe(map((it) => it === 'connected'))
        if (timeoutMilli > 0) {
            await firstValueFrom(src$.pipe(timeout(timeoutMilli)))
        } else {
            await firstValueFrom(src$)
        }
    }

    /**
     * 하드웨어 명령을 전송한다.
     * 응답을 기다리지 않는다.
     * 연결이 끊어진 상태에서 호출하면 예외가 발생한다.
     *
     * @param hwId 하드웨어 ID
     * @param cmd 명령어
     * @param args 명령어 파라미터
     */
    sendForget = (hwId: string, cmd: string, ...args: any[]) => {
        const requestId = nextRequestId()

        // 연결이 안되채로 호출하면 예외가 발생한다
        this.socket.send({
            requestId,
            clietnMeta: { clientType: this.clientType },
            hwId,
            cmd,
            args,
        })
    }

    /**
     * 하드웨어 명령을 전송한다.
     * 응답을 기다린다.
     * 연결이 끊어진 상태에서 호출하면 예외가 발생한다.
     *
     * @param hwId 하드웨어 ID
     * @param cmd 명령어
     * @param args 명령어 파라미터
     */
    send = async (hwId: string, cmd: string, ...args: any[]): Promise<DeviceCtlResponse> => {
        const requestId = nextRequestId()

        // 연결이 안되채로 호출하면 예외가 발생한다
        this.socket.send({
            requestId,
            clietnMeta: { clientType: this.clientType },
            hwId,
            cmd,
            args,
        })

        return await firstValueFrom(this.socket.observeDeviceCtlResponseV2(requestId))
    }
}
