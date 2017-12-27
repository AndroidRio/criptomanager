//index.js
require("dotenv-safe").load()
const MercadoBitcoin = require("./api").MercadoBitcoin
const MercadoBitcoinTrade = require("./api").MercadoBitcoinTrade
var infoApi = new MercadoBitcoin({ currency: 'BTC' })
var tradeApi = new MercadoBitcoinTrade({ 
    currency: 'BTC', 
    key: process.env.KEY, 
    secret: process.env.SECRET, 
    pin: process.env.PIN 
})

function getQuantity(coin, price, isBuy, callback){
    price = parseFloat(price)
    coin = isBuy ? 'brl' : coin.toLowerCase()

    tradeApi.getAccountInfo((response_data) => {
        var balance = parseFloat(response_data.balance[coin].available).toFixed(5)
		balance = parseFloat(balance)
        if(isBuy && balance < 50) return console.log('Sem saldo disponível para comprar!')
        console.log(`Saldo disponível de ${coin}: ${balance}`)
        
        if(isBuy) balance = parseFloat((balance / price).toFixed(5))
        callback(parseFloat(balance) - 0.00001)//tira a diferença que se ganha no arredondamento
    }, 
    (data) => console.log(data))
}

setInterval(() => 
   infoApi.ticker((tick) => {
	   console.log('\n')
	   console.log('==================================================')
	   console.log('Atual cotação:')
       console.log(tick)
	   console.log('\n')
	   var buyValue = 40000
	   console.log('Se valor da última venda (' + tick.ticker.sell + ') for menor ou igual a ' + buyValue)
	   console.log('E o valor da última venda (' + tick.ticker.sell + ') for maior que o valor mais baixo do dia (' + tick.ticker.low + ')')
	   console.log('Comprar saldo disponível e vender por ' + buyValue * parseFloat(process.env.PROFITABILITY) + '(+' + ((parseFloat(process.env.PROFITABILITY) - 1) * 100)  + '%)')
       if(tick.ticker.sell <= buyValue && tick.ticker.sell > tick.ticker.low){
           getQuantity('BRL', tick.ticker.sell, true, (qty) => {
                tradeApi.placeBuyOrder(qty, tick.ticker.sell, 
                    (data) => {
                        console.log('Ordem de compra inserida no livro. ' + data)
                        //operando em STOP
                        tradeApi.placeSellOrder(data.quantity, tick.ticker.sell * parseFloat(process.env.PROFITABILITY), 
                            (data) => console.log('Ordem de venda inserida no livro. ' + data),
                            (data) => console.log('Erro ao inserir ordem de venda no livro. ' + data))
                    },
                    (data) => console.log('Erro ao inserir ordem de compra no livro. ' + data))
           })
       }
       else
            console.log('Ainda muito alto, vamos esperar pra comprar depois.')
   }),
   process.env.CRAWLER_INTERVAL
)
