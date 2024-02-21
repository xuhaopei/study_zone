import OpenAI from "openai"

const openai = new OpenAI()

async function main() {
    console.log('开始，没钱 沙雕！我是垃圾！')
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }],
            model: "gpt-3.5-turbo",
        })
        console.log(completion.choices[0])
    } catch (error) {
        console.error(error)
    }

}

main()