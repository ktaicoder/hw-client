import { tap, BehaviorSubject, filter, map, Observable, Subject, Subscription } from 'rxjs'
import io, { Socket } from 'socket.io-client'
import { RxSocketIoClient } from './RxSocketIoClient'

type WebSocketState = 'first' | 'connected' | 'disconnected'

const DEVICE_CTL_REQUEST_V2 = 'deviceCtlMsg_v2:request'
const DEVICE_CTL_RESPONSE_V2 = 'deviceCtlMsg_v2:response'

export type DeviceCtlResponse = {
    requestId: string
    success: boolean
    error?: string
    body?: any
}

export class HwSocket {
    private _sock: Socket | null = null
    private _subscription: Subscription | null = null
    private _state$ = new BehaviorSubject<WebSocketState>('first')
    private _deviceCtlResponseV2$ = new Subject<DeviceCtlResponse>()

    constructor(public websocketUrl: string) {}

    observeState = (): Observable<WebSocketState> => {
        return this._state$.asObservable()
    }

    ////
    observeDeviceCtlResponseV2 = (requestId: string): Observable<DeviceCtlResponse> => {
        return this._deviceCtlResponseV2$.asObservable().pipe(filter((it) => it.requestId === requestId))
    }

    /**
     * 상태가 정상일때 소켓을 발행한다
     */
    private observeConnectedSocket = (): Observable<Socket | null> => {
        return this._state$.pipe(
            tap((it) => console.log('XXXX SOCKET STATE:' + it)),
            map((it) => (it === 'connected' ? this._sock! : null)),
        )
    }

    isConnected = (): boolean => {
        return this._sock?.connected === true
    }

    isDisconnected = (): boolean => {
        return !this.isConnected()
    }

    connect = () => {
        if (this._sock) {
            return
        }
        this._state$.next('first')
        const sock = io(this.websocketUrl, {
            autoConnect: true,
            path: '/socket.io',
        })
        this._sock = sock
        const subscription = RxSocketIoClient.fromConnectEvent(sock).subscribe(() => {
            this._state$.next('connected')
        })

        subscription.add(
            RxSocketIoClient.fromDisonnectEvent(sock).subscribe((reason) => {
                console.log('disconnected reason:' + reason)
                this._state$.next('disconnected')
                this._onDisconnected(false)
            }),
        )

        subscription.add(
            RxSocketIoClient.fromDisonnectEvent(sock).subscribe((err) => {
                console.log('error occured = ' + err)
            }),
        )

        subscription.add(
            RxSocketIoClient.fromMessageEvent(sock, DEVICE_CTL_RESPONSE_V2)
                .pipe(
                    filter((msg) => {
                        const valid = typeof msg['requestId'] === 'string' && typeof msg['success'] === 'boolean'
                        if (!valid) {
                            console.warn('unknown DeviceCtlResponse', msg)
                        }
                        return valid
                    }),
                    map((msg) => msg as DeviceCtlResponse),
                )
                .subscribe((msg) => {
                    this._deviceCtlResponseV2$.next(msg)
                }),
        )
    }

    /**
     * 강제로 연결을 종료한다
     */
    disconnect = () => {
        this._onDisconnected(true)
    }

    private _onDisconnected = (destroy: boolean) => {
        if (destroy) {
            this._subscription?.unsubscribe()
            this._subscription = null

            const s = this._sock
            if (s != null) {
                this._sock?.close()
                this._sock = null
            }
        }

        if (this._state$.value !== 'disconnected') {
            this._state$.next('disconnected')
        }
    }

    send = (frame: {
        requestId: string
        clietnMeta: { clientType?: 'normal' | 'blockcoding' }
        hwId: string
        cmd: string
        args?: any[]
    }) => {
        const sock = this._sock
        if (!sock) {
            throw new Error('not connected')
        }

        sock.emit(DEVICE_CTL_REQUEST_V2, frame)
    }
}
