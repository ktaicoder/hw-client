# hw-client

하드웨어 서버와 통신하는 웹소켓(socket.io) 클라이언트입니다.

## 설치

이 라이브러리는 다음과 같이 설치할 수 있습니다.

```bash
$  yarn add @ktaicoder/hw-client
```

### 필수 디펜던시 설치
이 라이브러리를 사용하려면 `rxjs@^7`와 `socket.io@^4` 라이브러리가 필요합니다.
```bash
$  yarn add rxjs@^7 socket.io@^4
```

## 예제

### 연결 및 끊기 함수

```javascript
const client = new HwClient('ws://127.0.0.1:3001', 'blockcoding');
client.connect();// 연결하기
client.disconnect(); // 연결 끊기
```

사용을 다 한 경우에는 반드시 `disconnect()`를 호출해야 한다.


### 연결 상태 모니터링

```javascript
client.connect();// 연결하기

// 모니터링
client.observeConnect().subscript((connected) => {
    if(connected) {
        console.log('연결되었습니다')
    } else {
        console.log('연결되지 않았습니다')
    }
});

// 연결될때까지 기다리기(타임아웃 5000ms)
await client.waitForConnected(5000)

```

 ### 데이터 송수신
데이터를 전송하는 함수는 두가지 종류다.

- `client.sendForgot()` 데이터 전송 후, 응답을 기다리지 않는다.
 하드웨어에 값이 정상적으로 도착했는지 알 수는 없다. 그냥 전송만 한 것이다. 실제로 블록코딩에서는 응답이 필요없는 경우가 있다.
- `client.sendAndWait()` 데이터 전송 후 응답을 기다린다.
이 함수는 실제로 하드웨어에 값을 정상적으로 전송했음을 보장한다. 응답을 기다리므로 함수가 리턴하기 까지 시간이 걸린다. `Promise`를 리턴한다.

#### `sendForgot` 예제

아래는 `wiseXboard` 하드웨어의 1번 핀에 0을 쓰는 예제다. `sendForgot()`을 호출하고 있으므로 함수 호출은 즉시 리턴하고, 전송이 성공인지 아닌지는 알 수 없다.

 ```javascript
const hwId = 'wiseXboard'// 하드웨어ID
const pinNum = 1
const pinValue = 0
client.sendForgot(hwId, 'digitalWrite', pinNum, pinValue)
 ```

#### `sendAndWait` 예제

아래는 `wiseXboard` 하드웨어의 1번 핀에 0을 쓰는 예제다. `sendAndWait`을 호출하고 있다.
응답을 기다리며, 응답이 도착하면, 성공인지 실패인지 알 수 있다.

 ```javascript
 const hwId = 'wiseXboard'// 하드웨어ID
const pinNum = 1
const pinValue = 0
const response = await client.sendAndWait(hwId, 'digitalWrite', pinNum, pinValue)
const {success, error, body } = response
if(success) {
    console.log('send success')
    if(body) {
        console.log('result data exists: ' + body)
    }
} else {
    // success가 아니면 error는 값이 반드시 존재함, error는 string 타입이다.
    console.log('send fail, error=' + error)
}
 ```

#### 값을 읽을 때

- 값을 읽을 때는 `sendAndWait()`을 호출한다.