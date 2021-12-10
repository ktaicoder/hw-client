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
