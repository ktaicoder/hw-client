# hw-client

하드웨어 서버와 통신하는 웹소켓(socket.io) 클라이언트입니다.

## 설치

이 라이브러리는 다음과 같이 설치할 수 있습니다.

```bash
$  yarn add @ktaicoder/hw-client
```

### 필수 디펜던시 설치
- 이 라이브러리를 사용하려면 `rxjs@^7`와 `socket.io@^4` 라이브러리가 필요합니다. `peerDependency`로 설정되어 있으므로 직접 설치해야 합니다.

- `rxjs`와 `socket.io`는 2021년 12월 시점의 최신 버전을 이용하고 있습니다. 따라서
다음과 같이 설치할 수 있습니다.

```bash
$  yarn add rxjs socket.io
```



## 예제

### 연결 및 끊기 함수

```javascript
const client = new HwClient('ws://127.0.0.1:3001', 'normal');
client.connect();// 연결하기
client.disconnect(); // 연결 끊기
```

사용을 마친 경우에는 `disconnect()`를 호출해야 합니다.


### 연결 상태 모니터링

간단한 테스트를 하는 경우라면 보통 다음과 같이 사용합니다.
```javascript
client.connect();// 연결하기

// 연결될때까지 기다리기
await client.waitForConnected()

// 실제 데이터 전송
// client.send(.....)
```

`rxjs` 의 옵저버블이 필요하다면 다음과 같이 할 수 있습니다.

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

```

### 데이터 송수신
데이터를 전송하는 함수는 `send()`입니다.
- `send()` 함수의 리턴값은 `Promise`이고, `Promise`에 성공 여부, 에러, 요청 결과 데이터가 포함됩니다.

- 또 다른 함수로 `client.sendForget()`이 있는데, 데이터 전송 후, 응답을 기다리지 않습니다.
 하드웨어에 값이 정상적으로 도착했는지 알 수는 없고 그냥 전송을 시도한 것입니다.
- `send()`가 있는데, `sendForget()`이 필요한가 의문이 들텐데, 대부분 필요없을 것입니다. 블록 코딩의 필요에 의해 만들었습니다. 성공여부와 상관없이 다음 코드를 진행하고 싶을 때 사용합니다.

#### `sendForget` 예제

`sendForget()`이 더 간단하므로, 먼저 살펴봅니다.

아래는 `wiseXboard` 하드웨어의 1번 핀에 1을 쓰는 예제입니다. 
`sendForget()` 함수 호출은 즉시 리턴합니다. 전송이 성공인지 아닌지는 알 수 없지만, 전송이 성공이라면 1번 핀에 연결된 LED의 불이 켜질 것입니다.

 ```javascript
const hwId = 'wiseXboard'// 하드웨어ID
const pinNum = 1
const pinValue = 1
client.sendForget(hwId, 'digitalWrite', pinNum, pinValue)
 ```

#### `send` 예제

아래는 위와 같은 동작을 `send()` 함수로 구현한 예제입니다.
응답을 기다리며, 응답이 도착하면, 성공인지 실패인지 알 수 있습니다.

```javascript
const hwId = 'wiseXboard'// 하드웨어ID
const pinNum = 1
const pinValue = 0
const response = await client.send(hwId, 'digitalWrite', pinNum, pinValue)
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

- 값을 읽을 때도 `send()`을 호출합니다. `read()` 같은 함수는 없습니다. 1번 핀을 읽겠다는 요청을 전송하므로 `send()` 함수를 사용하는 것입니다.
- 아래는 1번 핀의 값을 읽는 예제입니다.

```javascript
const hwId = 'wiseXboard'// 하드웨어ID
const pinNum = 1
const response = await client.send(hwId, 'digitalRead', pinNum)
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

### 전체 예제

전체 예제는 `example` 폴더에 있습니다. 다음과 같이 실행합니다.

```bash
$  cd example
$  yarn install
$  yarn dev
```

#### 전체 예제 소스코드
```javascript
import { HwClient } from '@ktaicoder/hw-client'

function sleepMs(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

/**
 * test for digitalRead
 */
async function testDigitalRead(client: HwClient) {
    const pinNum = 1
    const hwId = 'wiseXboard' // 하드웨어ID
    const response = await client.send(hwId, 'digitalRead', pinNum)
    const { success, error, body } = response
    if (success) {
        console.log('send success')
        console.log('result data: ' + body)
    } else {
        // success가 아니면 error는 값이 반드시 존재함, error는 string 타입이다.
        console.log('send fail, error=' + error)
    }
}

/**
 * test for digitalWrite
 */
async function testDigitalWrite(client: HwClient) {
    const pinNum = 1
    const pinValue = 1
    const hwId = 'wiseXboard' // 하드웨어ID
    const response = await client.send(hwId, 'digitalWrite', pinNum, pinValue)
    const { success, error, body } = response
    if (success) {
        console.log('send success')
        console.log('result data: ' + body)
    } else {
        // success가 아니면 error는 값이 반드시 존재함, error는 string 타입이다.
        console.log('send fail, error=' + error)
    }
}

async function run(client: HwClient) {
    await testDigitalRead(client)
    await testDigitalWrite(client)
    await sleepMs(3000)
}

async function main() {
    const client = new HwClient('ws://127.0.0.1:3001', 'normal')
    try {
        client.connect()

        console.log('wait for connected')
        await client.waitForConnected()

        console.log('connected')
        await run(client)
    } catch (err: any) {
        console.log(err.message)
    } finally {
        client.disconnect()
    }
}

main()

```
