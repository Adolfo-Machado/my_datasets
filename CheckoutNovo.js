/// <reference path="../JQuery/jquery-1.4.1-vsdoc.js" />

var JsCompra;

GlobalCheckout = {
    selectedOptions: null
    , loginMO: null
    , dadosCheckout: null
};

var montaLightboxInfoEntrada = function () {

    var codOferta = parseInt($('#hdnCodOferta').val());

    CheckoutNovo.TemplateInfoEntrada(codOferta, function (res) {

        if (!res.value.Sucesso) {

            alert(res.value.MensagemErro);

        } else {

            $('#overlayInfoEntrada').remove();

            var divLigthbox = $('<div>').attr('id', 'overlayInfoEntrada').addClass('overlayInfoEntrada');
            $('body').prepend(divLigthbox);

            var divFechar = $('<div style="width: 99%; height: 22px; text-align: right; background-color: transparent;">');
            divFechar.append($('<img style="border:none; cursor:pointer" src="http://img.viajarbarato.com.br/Images/Layout/fecharbranco.gif" alt="Fechar" class="close" border="0" >'));
            divFechar.click(function () {
                $('#overlayInfoEntrada').fadeOut();
                $('#mask').fadeOut();
            });
            divLigthbox.append(divFechar);

            divLigthbox.append(res.value.Retorno);

            //atribui o prefixo da moeda de pagamento
            $(divLigthbox).find('.infoPrefixo').text($('.entrada').find('.valor').find('span').text().replace(/.\d+/g, ''));

            //atribui o valor da entrada
            $(divLigthbox).find('.infoValorEntrada').text($('.entrada').find('.valor').find('span').text().replace(/[^0-9]+/, ''));

            //atribui o valor saldo
            $(divLigthbox).find('.infoValorSaldo').text($('.saldo').find('.valor').find('span').text().replace(/[^0-9]+/, ''));

            //divLigthbox.append($("<div></div>"));
            //divLigthbox.append($("<div>&nbsp;</div>"));
            //divLigthbox.append($("<div>&nbsp;</div>"));
            evModal('#overlayInfoEntrada');
        }

    });

};


$(function () {
    Globalize.culture("pt-BR");

    var qtdDisponivel;
    var qtdMaximaVendaPermitidaGeral;
    var taxasPacote;
    var codOfertaOpcao = parseInt($('#hdnCodOfertaOpcao').val());

    var cardType = window.CardType.cardType;
    var cards = window.CardType.cards;

    // LOGIN
    var intervalLogin = null;

    //PAGAMENTO
    var opcaoPagamento;

    // HOTEL
    var quartoSelecionado = null;
    var totalTaxAmount = 0;
    var totalValorSemTaxAmount = 0;

    //PASSAGEIRO
    var enderecoCompleto = {};
    var cliente = {};

    var flagOneTime = false;

    $('#blackFridayJS').remove();
    $('#blackFridayCSS').remove();
    $('#bannerBlackFriday').remove();
    $('#cronoFlutuanteBlackFriday').remove();

    JsCompra = new (function () {
        ////////////////////
        // MÉTODOS COMUNS //
        ////////////////////

        //#region METODOS


        var ValidaCPFPagamentoSorocred = function (cardNumber, element) {
            var el = $('#' + element);

            if (["627892"].indexOf(cardNumber.substring(0, 6)) > -1) {
                if (!el.is(":visible"))
                    el.parent().fadeToggle()
                return true;
            }
            //else {
            //    if (el.is(":visible"))
            //        el.parent().fadeToggle()
            //    el.value = "";
            //    return false;
            //}
            el.value = "";
            return false;
        }

        var Construtor = function () {
            // VERIFICA SE TEM PROMOÇÃO
            if (GlobalCheckout.dadosCheckout.ValoresPromocionais != null) {
                $('#txtCodPromocional').val(GlobalCheckout.dadosCheckout.ValoresPromocionais.CodigoPromocional);
            }

            //MontarTemplates();
            Autentificar();

            //LIMPA O LOADING DE ESPERA DAS OPÇÕES
            $('#loadingOpcoes').fadeOut().remove();

            CriteoBasketPageSalesPage('basketPage');

            try {

                FacebookAddToCart(
                    Globalize.format(Globalize.parseFloat($('.itemLista.total').find('.valor').text()), '')
                    , "BRL"
                    , Globalize.parseInt($('#hdnCodOferta').val()));
            } catch (e) {
                console.log(e)
            }

        }



        var MontarTemplates = function () {
            if (GlobalCheckout.dadosCheckout.Opcoes != null && GlobalCheckout.dadosCheckout.Opcoes.length > 0) {
                MontarTemplateOpcoes(0);
            }
            else if (GlobalCheckout.dadosCheckout.Hoteis != null && GlobalCheckout.dadosCheckout.Hoteis.length > 0) {
                MontarTemplateHoteis(0);
            }
        }

        var ValidaCPF = function (strCPF) {
            var Soma;
            var Resto;
            Soma = 0;
            if (strCPF == "00000000000") return false;

            for (i = 1; i <= 9; i++) Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
            Resto = (Soma * 10) % 11;

            if ((Resto == 10) || (Resto == 11)) Resto = 0;
            if (Resto != parseInt(strCPF.substring(9, 10))) return false;

            Soma = 0;
            for (i = 1; i <= 10; i++) Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
            Resto = (Soma * 10) % 11;

            if ((Resto == 10) || (Resto == 11)) Resto = 0;
            if (Resto != parseInt(strCPF.substring(10, 11))) return false;
            return true;
        }

        var VerificarEmail = function (email) {
            // Caracteres Excluidos
            var regEmail1 = /^[\w!#$%&'*+\/=?^`{|}~-]+(\.[\w!#$%&'*+\/=?^`{|}~-]+)*@(([\w-]+\.)+[A-Za-z]{2,6}|\[\d{1,3}(\.\d{1,3}){3}\])$/;
            var regEmail2 = /^[\w-]+(\.[\w-]+)*@(([\w-]{2,63}\.)+[A-Za-z]{2,6}|\[\d{1,3}(\.\d{1,3}){3}\])$/;
            var regEmail3 = /^[\w-]+(\.[\w-]+)*@(([A-Za-z\d][A-Za-z\d-]{0,61}[A-Za-z\d]\.)+[A-Za-z]{2,6}|\[\d{1,3}(\.\d{1,3}){3}\])$/;

            if (email.substring(0, 1) == '-') {
                return false;
            }

            if (regEmail1.test(email) && regEmail2.test(email) && regEmail3.test(email)) {
                return true;
            }
            else {
                return false;
            }
        }

        var MostrarErroRedirect = function (erro, redirect) {
            alert(erro);

            if (redirect) {
                // TODO: REDIRECT HIDDEN FIELD
            }
        }

        var MostrarLoading = function () {
            $('#step1').hide();
            $('.aguardeLoading').show();
            $('.infoTermosCondicoes').hide();

            BloquearControles(true);
        }

        var EsconderLoading = function () {
            $('.aguardeLoading').hide();
            $('.btnComprar').show();

            BloquearControles(false);

            ReiniciarPagamentoPix();
        }

        var BloquearControles = function (bloquear) {
            $("#txtEmail").prop("disabled", bloquear);
            $("[name='meioPagamento']").prop("disabled", bloquear);
            $("input","div.blocoEmail").prop("disabled", bloquear);
            $("select", "div.checkout-card").prop("disabled", bloquear);            
            $("select", "div.options-selection-container").prop("disabled", bloquear);
            $("button", "div.options-selection-container").prop("disabled", bloquear);

            if (bloquear) {                
                $(".loginFacebook").hide();

            } else {                
                $(".loginFacebook").show();
            }
        }

        var ReiniciarPagamentoPix = function () {
            if ($(".instrucoesPagamentoPix").hasClass("oculto") == false)
                $(".instrucoesPagamentoPix").addClass("oculto");

            $("img.imgQr", ".instrucoesPagamentoPix").attr("src", "");
            $("#hdQrCode", ".instrucoesPagamentoPix").val("");

            $('#step1').show();

            $("#chkTermosECondicoes").prop("checked", false);
            $('.infoTermosCondicoes').show();
        }
        

        var CriteoBasketPageSalesPage = function (tagCriteo, idCliente) {
            try {
                var itensOferta = [];
                var codOferta = GlobalCheckout.dadosCheckout.Oferta.CodOferta;
                /*
                dataLayer.push(
                            { event: "setAccount", account: 4067 },
                            { event: "setSiteType", type: tagCriteoDispositivo });
                            */

                dataLayer.push({
                    'setAccount': 4067,
                    'setSiteType': (/iPad/.test(navigator.userAgent) ? "t" : (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? "m" : "d"))
                });

                var valor = Globalize.format(Globalize.parseFloat($('.itemLista.totalPacote').find('.valor').text()), '');
                var quantidade = 0;

                $('.itens').each(function () {

                    quantidade += parseInt($(this).find('.quantidade').find('option').val());
                });

                if (tagCriteo == 'basketPage') {
                    itensOferta.push({ id: codOferta, price: valor, quantity: quantidade });

                    var data = new Date();
                    dataLayer.push({
                        'event': 'BasketPage',
                        'setProductId': itensOferta,
                        'setCustomerId:': data.getTime()
                    });
                    //dataLayer.push({ event: "viewBasket", item: itensOferta });
                }
            } catch (e) {
            }
        }

        var FacebookAddToCart = function (valor, moeda, codOferta) {

            var ids = [];
            ids.push(codOferta)

            try {
                fbq('track', 'AddToCart', {
                    value: valor,
                    currency: moeda,
                    content_ids: ids,
                    content_type: 'product',
                });
            }
            catch (e) { console.log('catch' + e) }
        }

        var FacebookPurchase = function (valor, moeda, codOferta) {

            var ids = [];
            ids.push(codOferta)

            try {
                fbq('track', 'Purchase', {
                    value: valor,
                    currency: moeda,
                    content_ids: ids,
                    content_type: 'product',
                });
            }
            catch (ex) { }
        }

        //$('#mesCartao').menuDropMobile();

        // $('#anoCartao').menuDropMobile();

        // iOS hack: Adiciona um optgroup para cada select pra evitar truncar opções com texto longo
        if (navigator.userAgent.match(/(iPad|iPhone|iPod touch)/i)) {
            $('#mesCartao').ajustaDropApple();

            $('#anoCartao').ajustaDropApple();
        }

        //#endregion METODOS

        //////////////
        // CREDITOS //
        //////////////

        var ValorCreditoDisponivel = function () {
            if (GlobalCheckout.loginMO != null && GlobalCheckout.loginMO != undefined && GlobalCheckout.loginMO.ValorTotalCredito > 0) {
                return GlobalCheckout.loginMO.ValorTotalCredito;
            }
            else {
                return 0;
            }
        }

        var ValorDescontoDisponivel = function () {
            return 0;
        }

        ////////////
        // OPCOES //
        ////////////

        var AplicarDescontoEarlyBooking = function (desconto, valorAtual) {
            if (desconto.ValorFinal)
                return valorAtual - desconto.ValorFinal;
            if (desconto.ValorDesconto)
                return desconto.ValorDesconto;
            if (desconto.PctDesconto)
                return (desconto.PctDesconto / 100) * valorAtual;
        };

        var ObterDescontoEarlyBooking = function (valorTotalItem, codTipoQuarto, dtCheckin, dtCheckout) {
            var quarto = GlobalCheckout.dadosCheckout.Hoteis[0].Quartos.filter(function (q) {
                return q.CodTipoQuarto === codTipoQuarto;
            })[0];
            if (!quarto) return 0;
            var noites = (dtCheckout - dtCheckin) / 1000 / 60 / 60 / 24;
            var diasAntesCheckin = (dtCheckin - new Date()) / 1000 / 60 / 60 / 24;
            var descontos = quarto.EarlyBookings.filter(function (d) {
                var prepareDate = function (dt) {
                    return new Date(dt.toDateString());
                };
                if (d.CheckinDe && prepareDate(dtCheckin) < prepareDate(d.CheckinDe))
                    return false;
                if (d.CheckinAte && prepareDate(dtCheckin) > prepareDate(d.CheckinAte))
                    return false;
                if (d.CheckoutDe && prepareDate(dtCheckout) < prepareDate(d.CheckoutDe))
                    return false;
                if (d.CheckoutAte && prepareDate(dtCheckout) > prepareDate(d.CheckoutAte))
                    return false;
                if (d.MinNoites && noites < d.MinNoites)
                    return false;
                if (d.MaxNoites && noites > d.MaxNoites)
                    return false;
                if (d.DiasAntesCheckin && d.DiasAntesCheckin > diasAntesCheckin)
                    return false;
                return true;
            });
            if (!descontos.length) return 0;

            var checkinTime = dtCheckin.getTime();
            var checkoutTime = dtCheckout.getTime();

            var dispPeriodo = quarto.DisponibilidadePrecos.filter(function (d) {
                var dispDate = d.Data.getTime();
                return dispDate >= checkinTime && dispDate < checkoutTime;
            });
            var diariasGratis = descontos.filter(function (d) {
                return d.DiariasGratis;
            }).reduce(function (prev, cur) {
                return prev + cur.DiariasGratis;
            }, 0); //CALCULA QUANTAS DIÁRIAS GRÁTIS AS PROMOÇÕES OFERECEM, ASSUMINDO QUE DIÁRIAS GRÁTIS NÃO SÃO CONDICIONADAS AOS DIAS DA SEMANA.
            var desconto = diariasGratis === 0
                ? 0
                : dispPeriodo.slice().reverse().slice(0, diariasGratis).reduce(function (prev, cur) {
                    return prev + cur.Preco;
                }, 0); //SOMA O VALOR DE DESCONTO INICIAL DE DIÁRIAS GRÁTIS DO FIM DA ESTADÍA

            descontos = descontos.filter(function (d) {
                return !d.DiariasGratis;
            });
            if (!descontos.length) return desconto;

            for (var i = 0; i < dispPeriodo.length; i++) {
                var disp = dispPeriodo[i];
                if (disp) {
                    var descontosDiaria = descontos.filter(function (d) {
                        return !d.DiasDaSemanaList.length || d.DiasDaSemanaList.includes(disp.Data.getDay());
                    }).map(function (d) {
                        return AplicarDescontoEarlyBooking(d, disp.Preco);
                    });
                    desconto += Math.max.apply(null, descontosDiaria);
                }
            }

            return desconto;
        };

        var ValoresOpcoes = function () {
            var totalOpcoes = 0;
            var totalEntrada = 0;
            var totalTaxas = 0;
            var totalDescontoEarlyBooking = 0;

            if (GlobalCheckout.dadosCheckout.Hoteis != null && GlobalCheckout.dadosCheckout.Hoteis.length > 0) {
                $('.itens').each(function (i) {
                    var divAtual = $(this);
                    var valorTotalItem = Globalize.parseFloat(divAtual.find('#totalCheckoutTotal').val(), $('#totalCheckoutTotal').data("culture"));
                    divAtual.data("culture", $('#totalCheckoutTotal').data("culture"));
                    var dtCheckin = Globalize.parseDate(divAtual.find("label.DataCheckin select option:selected").val());
                    var dtCheckout = Globalize.parseDate(divAtual.find("label.DataCheckout select option:selected").val());
                    var codTipoQuarto = parseInt(divAtual.find("#lblQuartos select option:selected").val(), 10);

                    totalOpcoes += valorTotalItem;
                    totalTaxas += Globalize.parseFloat(divAtual.find('#totalCheckoutTaxas').val());
                    totalDescontoEarlyBooking += ObterDescontoEarlyBooking(valorTotalItem, codTipoQuarto, dtCheckin, dtCheckout);
                });

                if (totalTaxas <= 0) $('.infoCheckout').hide();
            }

            else {
                $('.itens').each(function (i) {
                    var divAtual = $(this);
                    totalOpcoes += Globalize.parseFloat(divAtual.find('.valor span').text());
                    totalEntrada += Globalize.parseFloat(divAtual.find('.entrada span').text());
                    totalTaxas += Globalize.parseFloat(divAtual.find('.taxa span').text());
                });

                //popula variavel para enviar o valor da taxa quando ela for oculta
                taxasPacote = totalTaxas;
            }

            var objetoTotais = [];

            var infoItem = [];

            if (GlobalCheckout.dadosCheckout.Hoteis != null && GlobalCheckout.dadosCheckout.Hoteis.length > 0 && totalTaxas > 0) {
                infoItem.push({
                    NomeItem: 'Total sem taxa:'
                    , Valor: totalOpcoes
                    , Entrada: totalEntrada
                    , ETaxa: false
                });

                if (totalDescontoEarlyBooking)
                    infoItem.push({
                        NomeItem: 'Desconto de EarlyBooking:'
                        , Valor: totalDescontoEarlyBooking * -1
                        , Entrada: 0
                        , ETaxa: false
                    });

                infoItem.push({
                    NomeItem: 'Taxas e Serviços:'
                    , Valor: totalTaxas
                    , Entrada: 0
                    , ETaxa: false
                });

                objetoTotais.push({
                    Empacotar: false
                    , EmpacotarTaxa: false
                    , InfoItem: infoItem
                });
            } else if (GlobalCheckout.dadosCheckout.Hoteis && GlobalCheckout.dadosCheckout.Hoteis.length) {
                infoItem.push({
                    NomeItem: 'Total da Compra:'
                    , Valor: totalOpcoes
                    , Entrada: totalEntrada
                    , ETaxa: false
                });

                if (totalDescontoEarlyBooking)
                    infoItem.push({
                        NomeItem: 'Desconto:'
                        , Valor: totalDescontoEarlyBooking * -1
                        , Entrada: 0
                        , ETaxa: false
                    });

                objetoTotais.push({
                    Empacotar: false
                    , EmpacotarTaxa: false
                    , InfoItem: infoItem
                });
            }
            else {
                infoItem.push({
                    NomeItem: 'Total da Compra:'
                    , Valor: totalOpcoes
                    , Entrada: totalEntrada
                    , ETaxa: false
                });

                if (GlobalCheckout.dadosCheckout.Oferta.MostrarTaxas) {
                    infoItem.push({
                        NomeItem: 'Taxas e Serviços:'
                        , Valor: totalTaxas
                        , Entrada: 0
                        , ETaxa: true
                    });
                }

                objetoTotais.push({
                    Empacotar: true
                    , EmpacotarTaxa: true
                    , InfoItem: infoItem
                });
            }

            return objetoTotais;
        }

        var MontarTemplateOpcoes = function (indexOpcao) {
            var divDetalhesPacote = $('#detalhesPacote');

            if (indexOpcao == 0) {
                var usarDrop = GlobalCheckout.dadosCheckout.Opcoes.length > 1 ? true : false;
                var usarEntrada = GlobalCheckout.dadosCheckout.Opcoes[0].ValorEntrada > 0;

                // VE SE TEM TAXA
                var usarTaxa = false;
                for (var i = 0; i < GlobalCheckout.dadosCheckout.Opcoes.length; i++) {
                    if (GlobalCheckout.dadosCheckout.Opcoes[i].ValorTaxa > 0) {
                        usarTaxa = true;
                        break;
                    }
                }

                var ulHead = $('<ul>').attr('id', 'tituloItens').addClass('tituloItens');
                if (usarTaxa) {
                    ulHead.addClass('possuiTaxa')
                }

                var liItem = $('<li>').addClass('item').text('Opções:');
                var liIQtd = $('<li>').addClass('quantidade').text('Quantidade:');
                var liIValor = $('<li>').addClass('valor').text('Valor:');

                ulHead.append(liItem, liIQtd);

                if (usarEntrada) {
                    var liIEntrada = $('<li>').addClass('entrada').text('Entrada:');
                    ulHead.append(liIEntrada);
                    ulHead.find('.item').addClass('ajusteItem');
                }

                if (usarTaxa) {
                    var liITaxa = $('<li>').addClass('taxa').text('Taxa:');
                    ulHead.append(liITaxa);
                    ulHead.find('.item').addClass('ajusteItem');
                }

                ulHead.append(liIValor);

                divDetalhesPacote.append(ulHead);

                //insere item da oferta
                divDetalhesPacote.hide();
                divDetalhesPacote.append(RetornaHtmlLinhaOpcao(indexOpcao, usarDrop, usarEntrada));
                divDetalhesPacote.fadeIn();

                if (GlobalCheckout.dadosCheckout.Opcoes[0].Valor === GlobalCheckout.dadosCheckout.Opcoes[0].ValorEntrada) {
                    flagOneTime = true;
                }

                PopulaDropOpcoes(indexOpcao, usarDrop);


            }
            else {
                divDetalhesPacote.append(RetornaHtmlLinhaOpcao(indexOpcao, true, usarEntrada));
                PopulaDropOpcoes(indexOpcao, true);
            }



            AddItem(indexOpcao);
        }

        var PopulaDropOpcoes = function (indexOpcao, usarDrop) {
            try {
                var divItens = $('#item_' + indexOpcao);

                if (usarDrop) {
                    var select = divItens.find('.item').find('select');

                    var itemSelecionado = false;

                    for (var i = 0; i < GlobalCheckout.dadosCheckout.Opcoes.length; i++) {

                        var option = $('<option>').attr('value', GlobalCheckout.dadosCheckout.Opcoes[i].CodOfertaOpcao).text(GlobalCheckout.dadosCheckout.Opcoes[i].Nome);

                        if (codOfertaOpcao > 0 && codOfertaOpcao == GlobalCheckout.dadosCheckout.Opcoes[i].CodOfertaOpcao) {

                            option.attr('selected', 'selected');
                            itemSelecionado = true;
                        }
                        else {

                            var primeiroItemDisponivel = 0

                            if (i == 0 && GlobalCheckout.dadosCheckout.Opcoes[i].QuantidadeDisponivel.Quantidade <= 0) {
                                for (var j = 0; j < GlobalCheckout.dadosCheckout.Opcoes.length; j++) {
                                    if (GlobalCheckout.dadosCheckout.Opcoes[j].QuantidadeDisponivel.Quantidade > 0) {
                                        primeiroItemDisponivel = j;
                                        break;
                                    }
                                }
                            }

                            if (i == primeiroItemDisponivel) {
                                if (GlobalCheckout.dadosCheckout.Opcoes[i].ValorChamada && codOfertaOpcao <= 0) {
                                    option.attr('selected', 'selected');
                                }

                                if (divItens.find('.item').find('span').length == 0) {
                                    divItens.find('.item').find('select').after($('<span>'));
                                }

                                divItens.find('.item').find('span').after(RetornaSpanTextoOpcao(GlobalCheckout.dadosCheckout.Opcoes[0].CodOfertaOpcao));
                            }
                            if (GlobalCheckout.dadosCheckout.Opcoes[i].QuantidadeDisponivel.Quantidade <= 0 || GlobalCheckout.dadosCheckout.Opcoes[i].BloquearVenda) {
                                option.addClass('disabled').attr('disabled', 'disabled').text(GlobalCheckout.dadosCheckout.Opcoes[i].Nome + ' - ESGOTADO');
                            }
                            else {

                                if (!itemSelecionado) {

                                    if (GlobalCheckout.dadosCheckout.Opcoes[i].ValorChamada && codOfertaOpcao <= 0) {

                                        option.attr('selected', 'selected');
                                        itemSelecionado = true;
                                    }
                                    else if (GlobalCheckout.dadosCheckout.Opcoes[0].QuantidadeDisponivel.Quantidade <= 0 && GlobalCheckout.dadosCheckout.Opcoes[i].QuantidadeDisponivel.Quantidade > 0 && codOfertaOpcao <= 0) {


                                        option.attr('selected', 'selected');
                                        itemSelecionado = true;
                                    }
                                }
                                else {
                                    if (GlobalCheckout.dadosCheckout.Opcoes[i].ValorChamada && GlobalCheckout.dadosCheckout.Opcoes[i].QuantidadeDisponivel.Quantidade > 0 && codOfertaOpcao <= 0) {

                                        option.attr('selected', 'selected');
                                        itemSelecionado = true;
                                    }
                                }
                            }
                        }


                        if (!GlobalCheckout.dadosCheckout.Opcoes[i].Ocultar) {
                            select.append(option);
                        }
                    }

                    //$(select).menuDropMobile();
                    // iOS hack: Adiciona um optgroup para cada select pra evitar truncar opções com texto longo
                    if (navigator.userAgent.match(/(iPad|iPhone|iPod touch)/i)) {
                        $(select).ajustaDropApple();
                    }

                } else {
                    divItens.find('p').text(GlobalCheckout.dadosCheckout.Opcoes[0].Nome);

                    if (GlobalCheckout.dadosCheckout.Opcoes[0].Texto != null) {
                        //var span = $('<span>').addClass('textoDetalhe');
                        //span.text(GlobalCheckout.dadosCheckout.Opcoes[0].Texto);
                        //divItens.find('p').after(span);
                        divItens.find('p').after(RetornaSpanTextoOpcao(GlobalCheckout.dadosCheckout.Opcoes[0].CodOfertaOpcao));
                    }
                }
            }
            catch (ex) { /*TRATAR ERRO*/ }

            PopulaDropQuantidades(indexOpcao);
        }

        var RetornaSpanTextoOpcao = function (codOfertaOpcao) {
            var span = $('<span>').addClass('textoDetalheDestaque');

            for (var i = 0; i < GlobalCheckout.dadosCheckout.Opcoes.length; i++) {
                if (codOfertaOpcao == GlobalCheckout.dadosCheckout.Opcoes[i].CodOfertaOpcao) {
                    if (GlobalCheckout.dadosCheckout.Opcoes[i].Texto != "") {
                        span.text(GlobalCheckout.dadosCheckout.Opcoes[i].Texto);
                        break;
                    } else {
                        span = '';
                    }
                }
            }

            return span;
        }

        var PopulaDropQuantidades = function (indexOpcao) {

            try {
                var divItens = $('#item_' + indexOpcao);
                var selectQuantidade = divItens.find('.quantidade').find('select');

                //PopulaQuantidadesDisponiveis(selectQuantidade, 1);
            } catch (ex) { /*TRATAR ERRO*/ }

            $('.quantidade').on("change", function () {

                if ($('#item_' + indexOpcao).find('.quantidade').length > 0) {
                    PopulaValoresOpcoes(indexOpcao);
                    AlteraQuantidadesVizinhas(indexOpcao);
                }

            });

            PopulaValoresOpcoes(indexOpcao);
            AlteraQuantidadesVizinhas(indexOpcao);
        }

        var AlteraQuantidadesVizinhas = function (indexOpcao) {
            qtdDisponivel = GlobalCheckout.dadosCheckout.Oferta.QuantMaxVendas - GlobalCheckout.dadosCheckout.Oferta.QuantVendida;
            var qtdMaximaVendaPermitida = (GlobalCheckout.dadosCheckout.Oferta.QuantMaxCliente < qtdDisponivel) ? GlobalCheckout.dadosCheckout.Oferta.QuantMaxCliente : qtdDisponivel;

            qtdMaximaVendaPermitidaGeral = qtdMaximaVendaPermitida;

            var divItens = $('#item_' + indexOpcao);

            // POSSUI DROP QUARTOS
            if (divItens.find('.item').find('select').length > 0) {
                var codOpcaoAlterada = divItens.find('.item').find('select').val();

                if (codOfertaOpcao > 0 && codOpcaoAlterada == null) {

                    codOpcaoAlterada = codOfertaOpcao;
                }

                // SEPARA O GRUPO ALTERADO
                var grupoAlterado = null;


                if (GlobalCheckout.dadosCheckout.Opcoes != null && GlobalCheckout.dadosCheckout.Opcoes.length > 0) {
                    // FOR ENTRE TODOS OS GRUPOS
                    for (var i = 0; i < GlobalCheckout.dadosCheckout.Oferta.QuantidadesOpcoesJson.length; i++) {
                        var grupoOpcoes = GlobalCheckout.dadosCheckout.Oferta.QuantidadesOpcoesJson[i][0];

                        // FOR ENTRE AS OPCOES DO GRUPO
                        for (var j = 0; j < grupoOpcoes.length; j++) {
                            var codOpcaoAtual = grupoOpcoes[j];

                            if (codOpcaoAlterada == codOpcaoAtual) {
                                grupoAlterado = GlobalCheckout.dadosCheckout.Oferta.QuantidadesOpcoesJson[i];
                                break;
                            }
                        }
                    }
                }
                else if (GlobalCheckout.dadosCheckout.Hoteis != null && GlobalCheckout.dadosCheckout.Hoteis.length > 0) {
                    grupoAlterado = GlobalCheckout.dadosCheckout.Hoteis;
                }

                // PEGAR O TOTAL SELECIONADO DESSE GRUPO

                var totalSelecionadoDoGrupo = 0;
                var totalSelectionadoGeral = 0;

                $("div[id^='item_']").each(function (index, elemento) {
                    var selectOpcaoAtual = $(elemento).find('.item').find('select');
                    var qtdselectOpcaoAtual = isNaN(parseInt($(elemento).find('.quantidade').find('select').val())) ? 1 : parseInt($(elemento).find('.quantidade').find('select').val());

                    for (var i = 0; i < grupoAlterado[0].length; i++) {
                        var codOpcao = grupoAlterado[0][i];

                        if (selectOpcaoAtual.val() == codOpcao) {
                            totalSelecionadoDoGrupo += isNaN(parseInt($(elemento).find('.quantidade').find('select').val())) ? 1 : parseInt($(elemento).find('.quantidade').find('select').val());
                        }
                    }

                    totalSelectionadoGeral += isNaN(parseInt($(elemento).find('.quantidade').find('select').val())) ? 1 : parseInt($(elemento).find('.quantidade').find('select').val());
                });

                var totalPermitidoAindaDisponivel = (qtdMaximaVendaPermitida - totalSelectionadoGeral);

                var opcoesEscolhidas = [];
                var atingiuLimite = false;

                $("div[id^='item_']").each(function (index, elemento) {
                    var selectOpcaoAtual = $(elemento).find('.item').find('select');

                    opcoesEscolhidas.push([elemento, $(elemento).find('.quantidade').find('select').val()]);

                    for (var i = 0; i < grupoAlterado[0].length; i++) {
                        var codOpcao = grupoAlterado[0][i];

                        if (selectOpcaoAtual.val() == codOpcao) {
                            var qtdSelecionada = $(elemento).find('.quantidade').find('select').val() != null ? $(elemento).find('.quantidade').find('select').val() : 1;

                            var maximoOpcao = (grupoAlterado[1] - (totalSelecionadoDoGrupo - parseInt(qtdSelecionada)));

                            var maximoOpcaoPermitido = totalPermitidoAindaDisponivel + parseInt(qtdSelecionada);

                            var maximoPermitido = (maximoOpcaoPermitido > maximoOpcao) ? maximoOpcao : maximoOpcaoPermitido;

                            if (maximoPermitido <= 0) {
                                //$(elemento).remove();
                                opcoesEscolhidas.splice(index, 1);
                                atingiuLimite = true;
                                alert("Essa opção atingiu a quantidade máxima.");

                                var itemDisponivel = false;
                                for (var k = 0; k < $(elemento).find('.item').find('select')[0].length; k++) {
                                    for (var m = 0; m < grupoAlterado[0].length; m++) {
                                        if ($($(elemento).find('.item').find('select')[0][k]).val() == grupoAlterado[0][m]) {
                                            $($(elemento).find('.item').find('select')[0][k]).attr('disabled', 'disabled').addClass('disabled');
                                        }
                                    }

                                    if ($($(elemento).find('.item').find('select')[0][k]).attr('disabled') != 'disabled') {
                                        if (!itemDisponivel) {
                                            $($(elemento).find('.item').find('select')[0][k]).attr('selected', 'selected');
                                            itemDisponivel = true;
                                        }
                                    }
                                }
                            }

                            if (maximoPermitido == 0) {
                                //alert("Essa opção atingiu a quantidade máxima de compra.");
                                //AlteraQuantidadesVizinhas(indexOpcao);

                                PopulaQuantidadesDisponiveis($(elemento).find('.quantidade').find('select'), maximoOpcaoPermitido);
                            } else {
                                PopulaQuantidadesDisponiveis($(elemento).find('.quantidade').find('select'), maximoPermitido);
                            }
                        }
                    }
                });

                //percorre novamente as opções para retificar a quantidade

                if (atingiuLimite) {
                    for (var i = 0; i < opcoesEscolhidas.length; i++) {
                        PopulaQuantidadesDisponiveis($(opcoesEscolhidas[i][0]).find('.quantidade').find('select'), opcoesEscolhidas[i][1], true);
                    }

                    AddItem((opcoesEscolhidas.length - 1));
                }
            }
            else {
                if (GlobalCheckout.dadosCheckout.Oferta.QuantidadesOpcoesJson == null || GlobalCheckout.dadosCheckout.Oferta.QuantidadesOpcoesJson == "" || GlobalCheckout.dadosCheckout.Oferta.LimitePorOpcao) {
                    PopulaQuantidadesDisponiveis($('.itens').find('.quantidade select'), qtdMaximaVendaPermitidaGeral);
                }
            }

            //AlteraOpcoesVizinhas(indexOpcao);
            // APAGA O BOTÃO ADICIONAR MAIS UM QUANDO NÃO TEM MAIS QUEM ADICIONAR
        }

        var AlteraOpcoesVizinhas = function (indexOpcao) {
            //se a quantidad
        }

        var PopulaValoresOpcoes = function (indexOpcao) {
            try {
                var divItens = $('#item_' + indexOpcao);
                var spanValor = divItens.find('.valor span');
                var spanTaxa = divItens.find('.taxa span');
                var spanEntrada = divItens.find('.entrada span');

                var quantidade = 1;

                if (divItens.find('.item').find('select').length > 0) {
                    var codOpcao = divItens.find('.item').find('select').val();

                    quantidade = divItens.find('.quantidade').find('select').val() == null ? 1 : divItens.find('.quantidade').find('select').val();

                    for (var i = 0; i < GlobalCheckout.dadosCheckout.Opcoes.length; i++) {
                        if (codOpcao == GlobalCheckout.dadosCheckout.Opcoes[i].CodOfertaOpcao) {
                            spanValor.text(Globalize.format((quantidade * GlobalCheckout.dadosCheckout.Opcoes[i].Valor * GlobalCheckout.dadosCheckout.Oferta.Moeda.CotacaoMoeda), 'n2'));
                            spanTaxa.text(Globalize.format((quantidade * GlobalCheckout.dadosCheckout.Opcoes[i].ValorTaxa * GlobalCheckout.dadosCheckout.Oferta.Moeda.CotacaoMoeda), 'n2'));
                            spanEntrada.text(Globalize.format((quantidade * GlobalCheckout.dadosCheckout.Opcoes[i].ValorEntrada * GlobalCheckout.dadosCheckout.Oferta.Moeda.CotacaoMoeda), 'n2'));

                            //remove a tag span com o texto anterior
                            divItens.find('.item').find('span').remove();

                            //insere o texto da opção
                            if (divItens.find('.item').find('.excluir').length > 0) {
                                divItens.find('.item').find('.excluir').after(RetornaSpanTextoOpcao(GlobalCheckout.dadosCheckout.Opcoes[i].CodOfertaOpcao));
                            } else {
                                if (divItens.find('.item').find('.boxMenuDropMobile').length > 0) {
                                    divItens.find('.item').find('.selectFake').after(RetornaSpanTextoOpcao(GlobalCheckout.dadosCheckout.Opcoes[i].CodOfertaOpcao));
                                } else {
                                    divItens.find('.item').find('select').after(RetornaSpanTextoOpcao(GlobalCheckout.dadosCheckout.Opcoes[i].CodOfertaOpcao));
                                }
                            }

                            break;
                        }
                    }
                } else {
                    quantidade = divItens.find('.quantidade').find('select').val() == null ? 1 : divItens.find('.quantidade').find('select').val();
                    spanValor.text(Globalize.format((quantidade * GlobalCheckout.dadosCheckout.Opcoes[0].Valor * GlobalCheckout.dadosCheckout.Oferta.Moeda.CotacaoMoeda), 'n2'));
                    spanTaxa.text(Globalize.format((quantidade * GlobalCheckout.dadosCheckout.Opcoes[0].ValorTaxa * GlobalCheckout.dadosCheckout.Oferta.Moeda.CotacaoMoeda), 'n2'));
                    spanEntrada.text(Globalize.format((quantidade * GlobalCheckout.dadosCheckout.Opcoes[0].ValorEntrada * GlobalCheckout.dadosCheckout.Oferta.Moeda.CotacaoMoeda), 'n2'));
                }
            } catch (ex) { /*TRATAR ERRO*/ }

            AtualizarTotais();
            $('#blocoObsValores').fadeIn(); //MOSTRA O RESUMO DOS VALORES
            $('.blocoMeiosPagamento').fadeIn(); // MOSTRA A DIV COM MEIOS DE PAGAMENTO
        }

        var RetornaHtmlLinhaOpcao = function (idItem, usarDrop, usarEntrada) {
            // LABEL ENTRADA DA OPCAO
            var usarEntrada = GlobalCheckout.dadosCheckout.Opcoes[0].ValorEntrada > 0;
            var usarTaxa = false;
            for (var i = 0; i < GlobalCheckout.dadosCheckout.Opcoes.length; i++) {
                if (GlobalCheckout.dadosCheckout.Opcoes[i].ValorTaxa > 0) {
                    usarTaxa = true;
                    break;
                }
            }

            var divItens = $('<div>').addClass('itens').attr('id', 'item_' + idItem).attr('linha', idItem);
            if (usarTaxa) {
                divItens.addClass('possuiTaxa');
            }

            var fieldset = $('<fieldset>');
            var labelItem = $('<label>').addClass('item');

            // DROP OPÇÃO
            if (usarDrop) {
                var selectItem = $('<select>');
                labelItem.append(selectItem);
                selectItem.change(SelectOpcoes_ChangeHandler);
            }
            else {
                var pItem = $('<p>');
                labelItem.append(pItem);
            }

            if (idItem > 0) {
                var divExcluir = $('<div>').attr('id', 'excluirOpcao_' + idItem).attr('linha', idItem).addClass('excluir');
                labelItem.append(divExcluir);
                divExcluir.click(ExcluirOpcao_ClickHandler);
            }

            fieldset.append(labelItem);

            // DROP QUANTIDADE
            var labelQtd = $('<label>').addClass('quantidade');
            var selectQtd = $('<select>');

            //INSERINDO ROTULO PARA MOBILE
            labelQtd.append($('<em>').addClass('rotuloMobile').text('Quantidade: '));

            labelQtd.append(selectQtd);
            fieldset.append(labelQtd);
            selectQtd.change(SelectQuantidade_ChangeHandler);
            //selectQtd.on("change", SelectQuantidade_ChangeHandler);

            if (usarEntrada) {
                var labelEntrada = $('<label>').addClass('entrada');

                //INSERINDO ROTULO PARA MOBILE
                labelEntrada.append($('<em>').addClass('rotuloMobile').addClass('ativoVerde').text('Entrada: '));

                var spanEntrada = $('<span>').text(Globalize.format(0, 'n2'));
                labelEntrada.append(spanEntrada);
                fieldset.append(labelEntrada);
                labelItem.addClass('ajusteItem');
            }

            if (usarTaxa) {
                var labelTaxa = $('<label>').addClass('taxa');

                labelTaxa.append($('<em>').addClass('rotuloMobile').addClass('ativoVerde').text('Taxa: '));

                var spanTaxa = $('<span>').text(Globalize.format(0, 'n2'));
                labelTaxa.append(spanTaxa);
                fieldset.append(labelTaxa);
            }

            // LABEL VALOR DA OPCAO
            var labelValor = $('<label>').addClass('valor');

            //INSERINDO ROTULO PARA MOBILE
            labelValor.append($('<em>').addClass('rotuloMobile').text('Valor: '));

            var spanValor = $('<span>').text(Globalize.format(0, 'n2'));
            labelValor.append(spanValor);
            fieldset.append(labelValor);

            return divItens.append(fieldset);
        }

        var PopulaQuantidadesDisponiveis = function (selectAtual, numeroVezes, usarTotal) {
            var caraDeCima = selectAtual.parent();
            var itemAtual = parseInt(selectAtual.val());

            if (usarTotal) {
                itemAtual = numeroVezes;
            }

            selectAtual.remove(); // TRATA PAU DO IR

            selectAtual = $('<select>');
            caraDeCima.append(selectAtual);

            numeroVezes = isNaN(numeroVezes) ? 1 : numeroVezes;

            selectAtual.empty();

            for (var i = 0; i < numeroVezes; i++) {
                var option = $('<option>').attr('value', (i + 1)).text((i + 1));

                if ((i + 1) == itemAtual) {
                    option.attr('selected', 'selected');
                }
                selectAtual.append(option);
            }

            //$(selectAtual).menuDropMobile();

            // iOS hack: Adiciona um optgroup para cada select pra evitar truncar opções com texto longo
            if (navigator.userAgent.match(/(iPad|iPhone|iPod touch)/i)) {
                $(selectAtual).ajustaDropApple();
            }

        }

        // HANDLERS

        var ExcluirOpcao_ClickHandler = function () {
            var linha = parseInt($(this).parents("div[id^='item_']").attr('linha'));

            $('#item_' + linha).fadeOut().remove();

            //PopulaValoresOpcoes((linha - 1));
            //AlteraQuantidadesVizinhas((linha - 1));

            PopulaValoresOpcoes(0);
            AlteraQuantidadesVizinhas(0);

            var ultimaLinha = parseInt($('#detalhesPacote').find("div[id^='item_']").last().attr('linha'));



            AddItem(ultimaLinha);
        }

        var SelectQuantidade_ChangeHandler = function () {
            var index = parseInt($(this).parents("div[id^='item_']").attr('linha'));
            AlteraQuantidadesVizinhas(index);
        }

        var SelectOpcoes_ChangeHandler = function () {
            var linha = parseInt($(this).parents("div[id^='item_']").attr('linha'));
            PopulaValoresOpcoes(linha);
            AlteraQuantidadesVizinhas(linha);
            //AtualizarTotais();
        }

        var AddItem = function (indexOpcao) {
            if (GlobalCheckout.dadosCheckout.Opcoes.length > 1) {
                var divItens = $('#item_' + indexOpcao);

                var divAddItem = $('<div>').addClass('addItem');
                var aAddItem = $('<a>').attr('id', 'addItem').text(' + Adicionar mais uma opção');
                divAddItem.append(aAddItem);

                $('.itens').find('.addItem').remove();

                divItens.find('fieldset').append(divAddItem);

                aAddItem.click(function () {
                    var qtdEscolhida = 1;

                    $("div[id^='item_']").each(function (index, elemento) {
                        qtdEscolhida += parseInt($(elemento).find('.quantidade').find('select').val());
                    });

                    //VERIFICA SE O CLIENTE JÁ ATINGIU A COTA DE COMPRAS
                    if (qtdEscolhida > qtdMaximaVendaPermitidaGeral) {
                        alert('Você atingiu o limite de ' + qtdMaximaVendaPermitidaGeral + ' itens por compra.');
                        return;
                    } else {
                        var proximaLinha = parseInt($('#detalhesPacote').find('.itens').last().attr('linha'));
                        proximaLinha++;
                        MontarTemplateOpcoes(proximaLinha);
                    }
                });
            }
        }

        ///////////////
        /// HOTEIS ////
        ///////////////

        var MontarTemplateHoteis = function (indexQuarto) {
            var divDetalhesPacote = $('#detalhesPacote');

            var ulHead = $('<ul>').attr('id', 'tituloItens').addClass('tituloItens');

            var liItem = $('<li>').addClass('tituloQuarto').text('Selecione a sua opção:');
            var liIQtd = $('<li>').addClass('tituloCheckin').text('Checkin:');
            var liIValor = $('<li>').addClass('tituloCheckout').text('Checkout:');

            ulHead.append(liItem, liIQtd, liIValor);
            divDetalhesPacote.append(ulHead);

            var divItens = $('<div>').addClass('itens').attr('id', 'item_' + indexQuarto).attr('linha', indexQuarto);

            var fieldSetAtual = $('<fieldset>');

            var adicinouQuartoPrincipal = false; // PARA NAO ADICIONAR 2 PRINCIPAIS
            var quartoPrincipal = null;

            //TODO: MULTIPLOS HOTELS

            var hotel = GlobalCheckout.dadosCheckout.Hoteis[0];

            // CRIA CAMPO QUARTOS ///////////////////////////////////////////////////////////////////////////////////////////////////

            var lblQuartos = $('<label>').addClass('CheckoutQuartosNovo').attr('id', 'lblQuartos');
            lblQuartos.html('');

            var selectQuartos = $('<select>').addClass('CheckoutQuartos');

            for (var i = 0; i < hotel.Quartos.length; i++) {
                var opcaoQuartoAtual = $("<option>").attr("value", hotel.Quartos[i].CodTipoQuarto).text(hotel.Quartos[i].NomeQuarto);

                if (hotel.Quartos[i].Principal && !adicionouPrincipal) {
                    opcaoQuartoAtual.attr('selected', 'selected');
                    quartoPrincipal = hotel.Quartos[i];
                }
                selectQuartos.append(opcaoQuartoAtual);
            }

            // SE NO BANCO NAO TIVER NENHUM QUARTO PRINCIPAL, SELECIONA O PRIMEIRO
            if (quartoPrincipal == null) {
                quartoPrincipal = hotel.Quartos[0];
            }
            quartoSelecionado = quartoPrincipal;

            lblQuartos.append(selectQuartos);
            fieldSetAtual.append(lblQuartos);

            // CRIA CAMPO CAMAS ///////////////////////////////////////////////////////////////////////////////////////////////////

            var lblCamas = $('<label>').addClass('CheckoutCamas');
            lblCamas.html('');

            var selectCamas = $('<select>').addClass('Checkout');
            lblCamas.append(selectCamas);
            fieldSetAtual.append(lblCamas);

            // CRIA CAMPO CHECKIN ///////////////////////////////////////////////////////////////////////////////////////////////////

            var lblCheckin = $('<label>').addClass('DataCheckin').addClass('CheckinNovo');
            lblCheckin.html('');

            var selectCheckin = $('<select>').addClass('Checkout');
            var emRotuloCheckin = $('<em>').addClass('rotuloMobile').text('Checkin:');
            lblCheckin.append(emRotuloCheckin, selectCheckin);
            fieldSetAtual.append(lblCheckin);

            // CRIA CAMPO CHECKOUT //////////////////////////////////////////////////////////////////////////////////////////////////

            var lblCheckout = $('<label>').addClass('DataCheckout').addClass('CheckoutNovo');
            lblCheckout.html('');

            var selectCheckout = $('<select>').addClass('Checkout');
            var emRotuloCheckout = $('<em>').addClass('rotuloMobile').text('Checkout:');
            lblCheckout.append(emRotuloCheckout, selectCheckout);
            fieldSetAtual.append(lblCheckout);

            // CRIA CAMPO MEDIA/DIA /////////////////////////////////////////////////////////////////////////////////////////////////

            //var lblMediaDia = $('<label>').addClass('CheckoutMedia');
            //var spanMedia = $('<span>').addClass('spanTotal');
            //var spanMediaDia = $('<span>').addClass('valor');

            //spanMedia.html('');
            //spanMediaDia.html(Globalize.format(0, 'c2'));

            //lblMediaDia.append(spanMedia);
            //lblMediaDia.append(spanMediaDia);
            //fieldSetAtual.append(lblMediaDia);

            // CRIA CAMPO VALOR TOTAL ///////////////////////////////////////////////////////////////////////////////////////////////

            var hidTotal = $('<input>').addClass('CheckoutTotal').attr('type', 'hidden').attr('id', 'totalCheckoutTotal');
            var hidTaxas = $('<input>').addClass('CheckoutTaxas').attr('type', 'hidden').attr('id', 'totalCheckoutTaxas');

            //var spanTotal = $('<span>').addClass('spanTotal');
            //var spanTotalValor = $('<span>').addClass('valor');
            var aInfo = $('<a>').addClass('infoCheckout');

            //spanTotal.html('');
            //spanTotalValor.html(Globalize.format(0, 'c2'));
            hidTotal.val(Globalize.format(0, 'c2'))
            hidTaxas.val(Globalize.format(0, 'c2'))
            aInfo.html('i');

            //lblTotal.append(spanTotal);
            //lblTotal.append(spanTotalValor);
            //lblTotal.append(aInfo);

            $('#blocoObsValores').append(aInfo);

            fieldSetAtual.append(hidTaxas, hidTotal);

            // CRIA QUADRO DE VALORES/MEDIA /////////////////////////////////////////////////////////////////////////////////////////

            var quadroMedia = $('<div>').addClass('MediaDiaQuarto').attr('id', 'MediaDiaQuarto');
            var lista = $('<ul>');
            var itemData = $('<li>').addClass('Data').addClass('Bold');
            var itemValor = $('<li>').addClass('Valor').addClass('Bold');
            var itemTaxa = $('<li>').addClass('Taxa').addClass('Bold');
            var fechar = $('<a>').attr('id', 'fecharQuadroTaxasID');
            var clear = $('<div>').addClass('clear');

            itemData.html('Data');
            itemValor.html('Valor');
            itemTaxa.html('Taxa');
            fechar.append($('<i>').addClass('fa fa-times'), 'Fechar');

            lista.append(itemData, itemValor, itemTaxa);
            quadroMedia.append(lista, fechar, clear);

            $('#blocoObsValores').append($('<div>').addClass('boxMedia').attr('id', 'boxMedia'));
            $('#boxMedia').append(quadroMedia);

            //hidTotal.append(quadroMedia);

            // CRIA TEXTO DE POLÍTICA DE CANCELAMENTO //////////////////////////////////////////////////////////////////////////////

            if (hotel.PoliticaCancelamento != null || hotel.PoliticaCancelamento != "") {
                var divPolCancel = $('<div>').addClass('PoliticaCancelamentoHotel');
                var p = $('<span>').addClass('textoDetalheDestaque');

                p.append(hotel.PoliticaCancelamento);
                divPolCancel.append(p);
            }

            fieldSetAtual.append(divPolCancel);

            divItens.append(fieldSetAtual);
            divDetalhesPacote.append(divItens);

            // CRIA OS EVENTOS ////////////////////////////////////////////////////////////////////////////////////////////////////

            selectQuartos.change(selectQuartos_ChangeHandler);
            selectCamas.change(selectCamas_ChangeHandler);
            selectCheckin.change(selectCheckin_ChangeHandler);
            selectCheckout.change(selectCheckout_ChangeHandler);

            atualizarObjetoQuartoSelecionado(selectQuartos);

            $('#fecharQuadroTaxasID').click(function (evt) {
                evt.preventDefault();
                $('.MediaDiaQuarto').fadeOut();
                $('#mask').fadeOut();
            });

            $('.infoCheckout').click(function (evt) {
                evt.preventDefault();
                $('#mask').css('height', $(document).height()).fadeIn();
                $('.MediaDiaQuarto').fadeIn();
            });
        }

        // TEM A FUNÇÃO DE POPULAR A VARIAVEL: quartoSelecionado
        var atualizarObjetoQuartoSelecionado = function (select) {
            // PEGA O QUARTO NO ARRAY QUE GUARDA OS VALORES
            var codTipoQuarto = parseInt(select.val());
            quartoSelecionado = null;

            for (var i = 0; i < GlobalCheckout.dadosCheckout.Hoteis[0].Quartos.length; i++) {
                if (GlobalCheckout.dadosCheckout.Hoteis[0].Quartos[i].CodTipoQuarto == codTipoQuarto) {
                    quartoSelecionado = GlobalCheckout.dadosCheckout.Hoteis[0].Quartos[i];
                    break;
                }
            }

            if (quartoSelecionado == null) {
                alert('Ocorreu um erro ao listar os quartos disponíveis, entre em contato com nossa central de atendimento');
            }

            //$(select).menuDropMobile();
            // iOS hack: Adiciona um optgroup para cada select pra evitar truncar opções com texto longo
            if (navigator.userAgent.match(/(iPad|iPhone|iPod touch)/i)) {
                $(select).ajustaDropApple();
            }

            atualizarCamasHotel();
        }

        var atualizarCamasHotel = function () {
            // LIMPA O DROP DAS CAMAS
            var selectCamas = $('.CheckoutCamas').find('.Checkout');
            selectCamas.html('');

            // VERIFICA SE TEM CAMA
            // SE TIVER, POPULA O DROP DE CAMAS, SELECIONA A PRIMERA OPCAO DE CAMA, MOSTRA O DROP E POPULA AS DATAS DE CHECKIN
            // SENAO ESCONDE O DROP, PEGA A CAMA INDIFERENTE E POPULA AS DATAS DE CHECKIN

            // SÓ UMA CAMA
            if (quartoSelecionado.TiposCamas.length <= 1) {
                // ESCONDE AS CAMAS
                $('.CheckoutCamas').hide();
                if (quartoSelecionado.TiposCamas.length == 1) {
                    selectCamas.append($("<option>").attr("value", quartoSelecionado.TiposCamas[0].CodTipoCama).attr('selected', 'selected').text(quartoSelecionado.TiposCamas[0].NomeCama));
                }
            }
            else {
                $('.CheckoutCamas').show();
                $('#VoucherNome').css('width', '210px'); // REDUZ O CAMPO DO INPUT VOUCHER NOME PARA ADEQUAR O LAYOUT
                for (var i = 0; i < quartoSelecionado.TiposCamas.length; i++) {
                    if (i == 0) {
                        selectCamas.append($("<option>").attr("value", quartoSelecionado.TiposCamas[i].CodTipoCama).attr('selected', 'selected').text(quartoSelecionado.TiposCamas[i].NomeCama));
                    }
                    else {
                        selectCamas.append($("<option>").attr("value", quartoSelecionado.TiposCamas[i].CodTipoCama).text(quartoSelecionado.TiposCamas[i].NomeCama));
                    }
                }
            }

            atualizarCheckinHotel();
        }

        var atualizarCheckinHotel = function () {
            // ZERA OS VALORES
            var selectCheckin = $('.DataCheckin').find('.Checkout');
            //selectCheckin.html('');

            var primeiroOption = true;
            var minimoDeNoites = GlobalCheckout.dadosCheckout.Hoteis[0].MinimoNoites;

            // ADICIONA ATRIBUTO ESGOTADO PARA MONTAR AS OPTIONS
            for (var i = 0; i < quartoSelecionado.DisponibilidadePrecos.length; i++) {
                if (quartoSelecionado.DisponibilidadePrecos[i].Disponiveis == 0) {
                    var retornarIndices = i - minimoDeNoites + 1; // MENOS 1 PRA AJUSTAR A QUESTAO DIA/NOITE
                    if (retornarIndices < 0) retornarIndices = 0; // GARANTE O NEGATIVO

                    for (var j = retornarIndices; j <= i; j++) {
                        quartoSelecionado.DisponibilidadePrecos[j].Esgotado = true;
                    }
                }
                else {
                    quartoSelecionado.DisponibilidadePrecos[i].Esgotado = false;
                }
            }

            // MONTA AS OPTION

            var dataCheckin = $('.DataCheckin').find('.Checkout').find('option:selected').val();
            selectCheckin.html('');
            for (var i = 0; i < quartoSelecionado.DisponibilidadePrecos.length - minimoDeNoites; i++) {
                opcaoCheckin = $('<option>').attr('value', Globalize.format(quartoSelecionado.DisponibilidadePrecos[i].Data, 'dd/MM/yyyy')).attr('disp', quartoSelecionado.DisponibilidadePrecos[i].Disponiveis.toString());

                if (primeiroOption) {
                    if (Globalize.format(quartoSelecionado.DisponibilidadePrecos[i].Data, 'dd/MM/yyyy') == dataCheckin) {
                        if (quartoSelecionado.DisponibilidadePrecos[i].Esgotado != true) {
                            primeiroOption = false;
                            opcaoCheckin.attr('selected', 'selected');
                        }
                    }
                }

                if (quartoSelecionado.DisponibilidadePrecos[i].Esgotado == true) {
                    opcaoCheckin.addClass('disabled');
                    opcaoCheckin.attr('disabled', 'disabled');
                    opcaoCheckin.text(Globalize.format(quartoSelecionado.DisponibilidadePrecos[i].Data, 'dd/MM/yyyy') + ' [Esgotado]');
                    selectCheckin.append(opcaoCheckin);
                }
                else {
                    opcaoCheckin.text(Globalize.format(quartoSelecionado.DisponibilidadePrecos[i].Data, 'dd/MM/yyyy'));
                    selectCheckin.append(opcaoCheckin);
                }
            }

            atualizarCheckoutHotel();
        }

        var atualizarCheckoutHotel = function () {
            var mostrouAlert = false;
            if ($('.boxMotivo').length > 0) {
                $('.boxMotivo').remove();
            }

            // Pega Checkin
            var selectCheckin = $('.DataCheckin').find('.Checkout');
            var dataCheckinSelecionada = Globalize.parseDate(selectCheckin.val());

            // Pega Checkout
            var selectCheckout = $('.DataCheckout').find('.Checkout');
            var dataCheckoutSelecionada = Globalize.parseDate(selectCheckout.val());

            var minimoDeNoites = GlobalCheckout.dadosCheckout.Hoteis[0].MinimoNoites;

            var podeMostrarData = false;

            selectCheckout.html('');

            var primeiroOption = true;
            var optionCheckout;

            for (var i = 0; i < quartoSelecionado.DisponibilidadePrecos.length; i++) {
                if (Globalize.format(quartoSelecionado.DisponibilidadePrecos[i].Data, 'yyyyMMdd') == Globalize.format(dataCheckinSelecionada, 'yyyyMMdd')) {
                    podeMostrarData = true;

                    //INDICA QUE A DATA ESCOLHIDA POSSUI UM PERÍODO E O CHECKIN DEVE SER EM OUTRA DATA COM DURAÇÃO MÍNIMA DETERMINADA
                    if (quartoSelecionado.DisponibilidadePrecos[i].CodDisponibilidadeQuarto_Consolidadora_TipoQuarto_Checkin_Obrigatorio > 0) {
                        var dataCheckinObrigatorio;
                        var estoque;
                        var indexDataCheckin;
                        var motivo = null;
                        for (var j = 0; j < quartoSelecionado.DisponibilidadePrecos.length; j++) {
                            if (quartoSelecionado.DisponibilidadePrecos[i].CodDisponibilidadeQuarto_Consolidadora_TipoQuarto_Checkin_Obrigatorio
                                == quartoSelecionado.DisponibilidadePrecos[j].CodDisponibilidadeQuarto_Consolidadora_TipoQuarto) {
                                dataCheckinObrigatorio = quartoSelecionado.DisponibilidadePrecos[j].Data;
                                estoque = quartoSelecionado.DisponibilidadePrecos[j].Disponiveis;
                                indexDataCheckin = j;
                                break;
                            }
                        }

                        $('.DataCheckin').find('.Checkout option').each(function (e) {
                            if (Globalize.format(Globalize.parseDate($(this).val()), 'yyyyMMdd') == Globalize.format(dataCheckinObrigatorio, 'yyyyMMdd')) {
                                if (!$(this).hasClass("disabled") && estoque > 0) {
                                    $(this).attr('selected', 'selected');
                                    $('.DataCheckin').find('.Checkout').val($(this).val());

                                    motivo = quartoSelecionado.DisponibilidadePrecos[i].MotivoCheckinObrigatorio;
                                    //dataCheckinSelecionada = Globalize.parseDate($(this).val());
                                }
                            }
                        });

                        if (motivo != null) {

                            var divMotivo = $('<div>').addClass('boxMotivo');
                            var pMotivo = $('<p>').text(motivo);
                            divMotivo.append(pMotivo);

                            if ($('.boxMotivo').length > 0) {
                                $('.boxMotivo').remove();
                            }

                            $('.PoliticaCancelamentoHotel').after(divMotivo);

                            if (!mostrouAlert) {
                                alert(motivo);
                                mostrouAlert = true;
                            }
                        }

                    }

                    //CASO ESSA DATA EXIJA UM MÍNIMO DE NOITES (EXEMPLO SERIA FERIADOS PROLONGADOS TIPO CARNAVAL)
                    if (quartoSelecionado.DisponibilidadePrecos[i].MinimoNoites > 0 ||
                        quartoSelecionado.DisponibilidadePrecos[i].CodDisponibilidadeQuarto_Consolidadora_TipoQuarto_Checkin_Obrigatorio > 0) {
                        if (quartoSelecionado.DisponibilidadePrecos[i].CodDisponibilidadeQuarto_Consolidadora_TipoQuarto_Checkin_Obrigatorio > 0) {
                            i = indexDataCheckin + (quartoSelecionado.DisponibilidadePrecos[indexDataCheckin].MinimoNoites > 0 ? quartoSelecionado.DisponibilidadePrecos[indexDataCheckin].MinimoNoites : minimoDeNoites);
                        } else {
                            i = i + quartoSelecionado.DisponibilidadePrecos[i].MinimoNoites;
                        }
                    } else {
                        i = i + minimoDeNoites;
                    }
                }

                // SE JA PASSOU DA DATA DE CHECKIN
                if (podeMostrarData) {
                    optionCheckout = $('<option>').attr('value', Globalize.format(quartoSelecionado.DisponibilidadePrecos[i].Data, 'dd/MM/yyyy'));
                    optionCheckout.text(Globalize.format(quartoSelecionado.DisponibilidadePrecos[i].Data, 'dd/MM/yyyy'));

                    // SELECIONA O PRIMEIRO OPTION VALIDO
                    //                    if (primeiroOption) {
                    //                        primeiroOption = false;
                    //                        optionCheckout.attr('selected', 'selected');
                    //                    }
                    if (Globalize.format(quartoSelecionado.DisponibilidadePrecos[i].Data, 'yyyyMMdd') == Globalize.format(dataCheckoutSelecionada, 'yyyyMMdd')) {
                        optionCheckout.attr('selected', 'selected');
                    }

                    selectCheckout.append(optionCheckout);

                    //SE NÃO TIVER MAIS VAGAS NESSE DIA, NÃO COLOCA NENHUMA ADIANTE
                    if (quartoSelecionado.DisponibilidadePrecos[i].Disponiveis == 0) {
                        break;
                    }
                }



                //if (motivo != null) {
                //    debugger;
                //    var divMotivo = $('<div>').addClass('boxMotivo');
                //    var pMotivo = $('<p>').text(motivo);
                //    divMotivo.append(pMotivo);

                //    if ($('.boxMotivo').length > 0) {
                //        $('.boxMotivo').remove();
                //    }

                //    $('.PoliticaCancelamentoHotel').after(divMotivo);

                //    if (!mostrouAlert) {
                //        alert(motivo);
                //        mostrouAlert = true;
                //    }
                //}
            }

            atualizarPrecosHotel();
        };

        var atualizarPrecosHotel = function () {
            var dataCheckin = Globalize.format(Globalize.parseDate($('.DataCheckin').find('.Checkout').val()), 'yyyyMMdd');
            var dataCheckout;
            // TROCA DE HORARIO DE VERAO

            if ($('.DataCheckout').find('.Checkout').val() == '20/10/2013') {
                dataCheckout = Globalize.format(Globalize.parseDate($('.DataCheckout').find('.Checkout').val() + ' 02:00:00', 'dd/MM/yyyy hh:mm:ss'), 'yyyyMMdd');
            }
            else {
                dataCheckout = Globalize.format(Globalize.parseDate($('.DataCheckout').find('.Checkout').val()), 'yyyyMMdd');
            }

            var somaPrecos = false;

            var precoTotal = 0;
            var diasSelecionados = 0;

            totalTaxAmount = 0;
            totalValorSemTaxAmount = 0;

            // ENCONTRA O GRID MÉDIA DE VALORES
            var listaMediasValores = $('.MediaDiaQuarto').find('ul');

            // LIMPA O GRID MÉDIA DE VALORES, MAS NÃO APAGA OS ITENS COM A CLASSE BOLD
            listaMediasValores.find('li:not(.Bold)').each(function (i) { $(this).remove(); });

            for (var i = 0; i < quartoSelecionado.DisponibilidadePrecos.length; i++) {
                if (Globalize.format(quartoSelecionado.DisponibilidadePrecos[i].Data, 'yyyyMMdd') == dataCheckin) {
                    somaPrecos = true;
                }

                if (Globalize.format(quartoSelecionado.DisponibilidadePrecos[i].Data, 'yyyyMMdd') == dataCheckout) {
                    break;
                }

                if (somaPrecos) {
                    diasSelecionados++;
                    precoTotal += quartoSelecionado.DisponibilidadePrecos[i].PrecoSemTaxa + quartoSelecionado.DisponibilidadePrecos[i].TaxAmount;

                    var valorSemTaxa = quartoSelecionado.DisponibilidadePrecos[i].PrecoSemTaxa
                    //var valorTaxa = quartoSelecionado.DisponibilidadePrecos[i].Preco - quartoSelecionado.DisponibilidadePrecos[i].PrecoSemTaxa;
                    var valorTaxa = quartoSelecionado.DisponibilidadePrecos[i].TaxAmount;

                    totalTaxAmount += valorTaxa;
                    totalValorSemTaxAmount += valorSemTaxa;

                    var cinza = "";
                    if (i % 2 == 1) cinza = 'cinza-claro';

                    //POPULA GRID MÉDIA DE VALORES POR DIA
                    listaMediasValores.append($('<li>').addClass('Data').addClass(cinza).text(Globalize.format(quartoSelecionado.DisponibilidadePrecos[i].Data, 'dd/MM/yyyy')));
                    listaMediasValores.append($('<li>').addClass('Valor').addClass(cinza).text(Globalize.format(valorSemTaxa, 'c2')));
                    listaMediasValores.append($('<li>').addClass('Taxa').addClass(cinza).text(Globalize.format(valorTaxa, 'c2')));
                }
            }

            //var spanTotal = $('.CheckoutTotal').find('.valor');
            var spanTotal = $('#totalCheckoutTotal');
            var hidTaxas = $('#totalCheckoutTaxas');
            var hotel = GlobalCheckout.dadosCheckout.Hoteis[0];
            var spanMedia = $('.CheckoutMedia').find('.valor');
            var culture;
            if (hotel.Moeda && hotel.Moeda.Cotacao != 1) {
                $('#totalCheckoutTotal').data("culture", culture = 'en');
                totalValorSemTaxAmount *= hotel.Moeda.Cotacao;
                totalTaxAmount *= hotel.Moeda.Cotacao;
            }
            spanTotal.val(Globalize.format(totalValorSemTaxAmount, 'c2', culture));
            hidTaxas.val(Globalize.format(totalTaxAmount, 'c2', culture))
            spanMedia.html(Globalize.format(Math.round((precoTotal / diasSelecionados) * 100) / 100, 'c2'));

            valorTotalSemDesconto = precoTotal;

            AtualizarTotais();
            $('#blocoObsValores').fadeIn(); //MOSTRA O RESUMO DOS VALORES
            $('.blocoMeiosPagamento').fadeIn(); // MOSTRA A DIV COM MEIOS DE PAGAMENTO
        };

        // HANDLERS

        // HANDLERS HOTEIS //////////////////////

        var selectQuartos_ChangeHandler = function (evt) { atualizarObjetoQuartoSelecionado($(this)); };

        var selectCamas_ChangeHandler = function (evt) { };

        var selectCheckin_ChangeHandler = function (evt) { atualizarCheckoutHotel(); };

        var selectCheckout_ChangeHandler = function (evt) { atualizarPrecosHotel(); };

        ///////////////
        // CRUZEIROS //
        ///////////////

        var ValoresCruzeiros = function () {
            var objetoTotais = [];

            var infoItem = [];
            infoItem.push({
                NomeItem: 'Cabine'
                , Valor: 5000
                , Entrada: 50
                , ETaxa: false
            });

            objetoTotais.push({
                Empacotar: true
                , EmpacotarTaxa: false
                , InfoItem: infoItem
            });

            var taxas = [];
            taxas.push({
                NomeItem: 'Taxa Portuaria'
                , Valor: 100
                , Entrada: 1
                , ETaxa: true
            });
            taxas.push({
                NomeItem: 'Taxa Serviço'
                , Valor: 50
                , Entrada: 5
                , ETaxa: true
            });

            objetoTotais.push({
                Empacotar: false
                , EmpacotarTaxa: false
                , InfoItem: taxas
            });

            return objetoTotais;
        }

        ////////////////////
        // RESUMOS TOTAIS //
        ////////////////////

        //#region METODOS

        var AtualizarTotais = function () {
            var totais = [];

            //totais.push.apply(totais, ValoresCruzeiros());
            totais.push.apply(totais, ValoresOpcoes());

            var objTotalPagarAVista = MontaListaTotais(totais, ValorCreditoDisponivel());

            AtualizarValoresPagamento(objTotalPagarAVista);
        }

        var RetornaItemValor = function (nomeItem, valor, classe, showInfoIcon) {
            var liItemLista = $('<li>').addClass('itemLista');

            if (classe != null) liItemLista.addClass(classe);

            var ulItem = $('<ul>');

            var liItem = $('<li>').addClass('item');
            var liValor = $('<li>').addClass('valor');
            var spanValor = $('<span>');

            if (showInfoIcon && nomeItem == 'Entrada:') {
                var icon = $("<span class='infoicon_pagamento'><img src='https://viajarbarato-a.akamaihd.net/Images/Layout/iconquestion.png' width='14' /></span>");
                icon.click(montaLightboxInfoEntrada);
                liItem.append(icon, 'Entrada:');
            } else {

                liItem.text(nomeItem);
            }

            spanValor.text(Globalize.format(valor, 'c2'));
            liValor.append(spanValor);

            ulItem.append(liItem, liValor);
            liItemLista.append(ulItem);

            return liItemLista;
        }

        var MontaListaTotais = function (totais, totalCredito) {
            if (isNaN(totalCredito)) { totalCredito = 0 }
            var divDetalhesPacote = $('#quadroValores');
            var ul = $('<ul>');

            var totalDesconto = 0;

            var valorTotalPacote = 0;
            var valorTotalTaxas = 0;
            var valorTotalNegativo = 0;
            var entradaSemDesconto = 0;

            var mostrarLinha = false;
            var exibirPacoteAgrupado = false;
            var exibirTaxasAgrupadas = false;

            var qtdTaxas = 0;
            var qtdPrecos = 0;

            var htmlPrecos = $();
            var htmlTaxas = {};

            var totalPagar = 0



            //LIMPA DIV PARA ATUALIZAR A LISTA
            divDetalhesPacote.empty();

            // VERIFICA SE ALGUM PRECO PEDIU PARA SER EMPACOTADO
            for (var i = 0; i < totais.length; i++) {
                if (totais[i].Empacotar) {
                    exibirPacoteAgrupado = true;
                }

                if (totais[i].EmpacotarTaxa) {
                    exibirTaxasAgrupadas = true;
                }
            }

            // QUANDO TEM UM SÓ VALOR E NAO TEM CRÉDITO MOSTRA SO O TOTAL
            if (totais.length == 1 && totais[0].InfoItem.length == 1 && totalCredito == 0) {
                if (!totais[0].InfoItem[0].ETaxa) {
                    qtdPrecos++;
                    valorTotalPacote = totais[0].InfoItem[0].Valor;
                }
                else {
                    qtdTaxas++;
                    valorTotalTaxas = totais[0].InfoItem[0].Valor;
                }

                entradaSemDesconto = totais[0].InfoItem[0].Entrada;
            }
            else {
                // CALCULA OS VALORES
                for (var i = 0; i < totais.length; i++) {
                    for (var j = 0; j < totais[i].InfoItem.length; j++) {
                        // SE NAO É TAXA, É VALOR
                        if (!totais[i].InfoItem[j].ETaxa) {
                            if (!exibirPacoteAgrupado) {
                                ul.append(RetornaItemValor(totais[i].InfoItem[j].NomeItem, totais[i].InfoItem[j].Valor));
                            }

                            valorTotalPacote += totais[i].InfoItem[j].Valor;

                            qtdPrecos++;
                        }

                        // APROVEITA E SOMA AS ENTRADAS
                        if (totais[i].InfoItem[j].Entrada > 0) {
                            entradaSemDesconto += totais[i].InfoItem[j].Entrada;
                        }

                    }
                }


                // CALCULA AS TAXAS
                for (var i = 0; i < totais.length; i++) {
                    for (var j = 0; j < totais[i].InfoItem.length; j++) {
                        // TAXAS
                        if (totais[i].InfoItem[j].ETaxa) {
                            if (totais[i].InfoItem[j].Valor > 0) {
                                if (!exibirTaxasAgrupadas) {
                                    ul.append(RetornaItemValor(totais[i].InfoItem[j].NomeItem, totais[i].InfoItem[j].Valor));
                                }

                                valorTotalTaxas += totais[i].InfoItem[j].Valor;
                            }

                            qtdTaxas++;
                        }
                    }
                }
            }

            // DESCONTOS
            if (GlobalCheckout.dadosCheckout.ValoresPromocionais != null && (GlobalCheckout.dadosCheckout.ValoresPromocionais.PercentualDesconto > 0 || GlobalCheckout.dadosCheckout.ValoresPromocionais.ValorDesconto > 0)) {
                if (GlobalCheckout.dadosCheckout.ValoresPromocionais.PercentualDesconto > 0) {
                    totalDesconto += (valorTotalPacote * (GlobalCheckout.dadosCheckout.ValoresPromocionais.PercentualDesconto / 100));
                }

                if (GlobalCheckout.dadosCheckout.ValoresPromocionais.ValorDesconto) {
                    totalDesconto += GlobalCheckout.dadosCheckout.ValoresPromocionais.ValorDesconto;
                }
            }

            if (flagOneTime) {
                totalPagar = (valorTotalPacote + valorTotalTaxas) - totalDesconto;
            } else {
                totalPagar = valorTotalPacote - totalDesconto;
            }


            // ADICIONA OS VALORES EMPACOTADOS
            if (exibirPacoteAgrupado) {
                if (valorTotalTaxas > 0 || totalCredito > 0 || totalDesconto > 0) {
                    ul.append(RetornaItemValor("Total da Compra:", valorTotalPacote, 'totalPacote'));
                    mostrarLinha = true;
                }
            }

            // ADICIONA AS TAXAS EMPACOTADAS
            if (exibirTaxasAgrupadas && valorTotalTaxas > 0) {
                ul.append(RetornaItemValor("Taxas e Serviços:", valorTotalTaxas, 'totalTaxas'));
            }

            //////////////
            // CREDITOS //
            //////////////

            // SE TEM ENTRADA
            if (entradaSemDesconto > 0) {
                // SE ELA FOR MAIOR QUE O CREDITO, O CREDITO É O VALOR DA ENTRADA
                if (totalCredito > (entradaSemDesconto - totalDesconto)) {
                    totalCredito = entradaSemDesconto - totalDesconto;
                }
            }
            else {
                // SE ELA FOR MAIOR QUE O CREDITO, O CREDITO É O VALOR DO TOTAL
                if (totalCredito > totalPagar) {
                    totalCredito = totalPagar;
                }
            }

            ///////////////
            // DESCONTOS //
            ///////////////


            var totalDescontoMostrar = totalDesconto;
            if (totalDesconto > entradaSemDesconto) {
                totalDescontoMostrar = entradaSemDesconto;
            }

            if (totalDesconto > 0) {
                var nomePromocao = (GlobalCheckout.dadosCheckout.ValoresPromocionais.NomeCodigo != null && GlobalCheckout.dadosCheckout.ValoresPromocionais.NomeCodigo.length > 0) ? GlobalCheckout.dadosCheckout.ValoresPromocionais.NomeCodigo + ':' : 'Desconto:';
                ul.append(RetornaItemValor(nomePromocao, totalDescontoMostrar * -1, 'descontos'));
            }

            // ADICIONA OS CREDITOS e POSSUI ENTRADA
            if (totalCredito > 0) {
                ul.append(RetornaItemValor('Créditos Utilizados:', totalCredito * -1, 'creditos'));
            }

            // ADICIONA O TOTAL

            if (mostrarLinha) {
                ul.append($('<li>').addClass('linha'));
            }

            ul.append(RetornaItemValor('Total a Pagar:', valorTotalPacote + valorTotalTaxas - totalCredito - totalDesconto, 'total'));

            // ADICIONA AS ENTRADAS
            if (entradaSemDesconto > 0) {
                if (flagOneTime) {
                    totalPagar = (entradaSemDesconto + valorTotalTaxas) - totalCredito - totalDesconto;
                } else {
                    totalPagar = entradaSemDesconto - totalCredito - totalDesconto;
                }


                if (valorTotalPacote > entradaSemDesconto) {
                    ul.append(RetornaItemValor('Entrada:', totalPagar, 'entrada', true));
                }

            } else {
                totalPagar = totalPagar - totalCredito;
            }

            if (((valorTotalPacote + valorTotalTaxas - totalCredito - totalDesconto) - totalPagar) > 0 && !flagOneTime) {
                ul.append(RetornaItemValor('Saldo:', (valorTotalPacote + valorTotalTaxas - totalCredito - totalDesconto) - totalPagar, 'saldo'));
            }

            //INSERE NA DIV DETALHES DO PACOTE
            divDetalhesPacote.append(ul);

            //INSERE MENSAGEM DA MOEDA
            if (GlobalCheckout.dadosCheckout.Oferta.Moeda.CodMoeda != 3) {
                if ($('.textoCotacao').is(':visible')) $('.textoCotacao').remove();

                var moeda = GlobalCheckout.dadosCheckout.Oferta.Moeda;

                var divTextoCotacao = $('<div>').addClass('textoCotacao');
                var textoCotacao = $('<p>');
                textoCotacao.text('OBS: ' + moeda.NomeMoeda + ' calculado no câmbio de ' + Globalize.format(moeda.CotacaoMoeda, 'c2') + ' do dia ' + Globalize.format(moeda.DataCotacao, 'dd/MM/yyyy'));
                divTextoCotacao.append(textoCotacao);

                $('.infoMeioPagamento').after(divTextoCotacao);
            }

            var resultObject = {
                "totalPagar": totalPagar,
                "flagOneTime": flagOneTime
            }
            return resultObject;
        }

        //#endregion METODOS

        // VALIDADORES

        // HANDLERS

        ///////////////////
        // LOGIN CLIENTE //
        ///////////////////

        //#region METODOS

        this.SeloAutenticado = SeloAutenticado;

        var SeloAutenticado = function (flagDesejada) {
            //var elemento = $('#autenticado');

            //elemento.removeClass('autenticarLoading');
            //elemento.removeClass('oculto');
            //elemento.removeClass('aprovado');
            //elemento.removeClass('negado');
            //elemento.removeClass('autenticarLoading');

            //$('#txtEmail').css('border', '1px solid #cecece');

            //if (flagDesejada == "erro") {
            //    elemento.addClass('negado');
            //    $('#txtEmail').css('border', '1px solid #fc6500');
            //}
            //else if (flagDesejada == "loading") {
            //    elemento.addClass('autenticarLoading');
            //    $('#txtEmail').css('border', '1px solid #cecece');
            //}
            //else if (flagDesejada == "ok") {
            //    elemento.addClass('aprovado');

            //    $('#txtEmail').css('border', '1px solid #cecece');
            //}
        }

        this.FB_LoginCheckOut = function () {
            FB.login(function (response) {
                if (response.authResponse) {
                    access_token = response.authResponse.accessToken; //get access token
                    user_id = response.authResponse.userID; //get FB UID

                    FB.api('/me?fields=name,email,gender', function (me) {
                        var nome = me.name;
                        var email = me.email;
                        var codFacebook = me.id;
                        var sexo = me.gender;
                        var verificado = me.verified;
                        //var dataNascimento = Globalize.parseDate(me.birthday);

                        $("#txtEmail").val(email);

                        //verifica se está na página de login
                        try {
                            var codOferta = parseInt($('#hdnCodOferta').val());

                            CheckoutNovo.LoginFacebook(codOferta, nome, email, codFacebook, sexo, function (res) {
                                //debugger;
                                if (res.value.Sucesso == true) {
                                    GlobalCheckout.loginMO = res.value.Retorno;

                                    if (GlobalCheckout.loginMO.CodCliente > 0) {
                                        SeloAutenticado("ok");
                                    }

                                    // AtualizarTotais();
                                }
                                else {
                                    alert(res.value.Mensagem);
                                };
                            });
                        } catch (e) {
                            var a = e;
                        }
                    });
                }
                // else {
                //    //user hit cancel button
                //    alert('User cancelled login or did not fully authorize.');

                //}
            }, {
                scope: 'email,user_gender'
            });
        }

        var AutenticarEmail = function (email, origem, mostrarOk) {
            GlobalCheckout.loginMO = null;

            if (!VerificarEmail(email)) {
                if (mostrarOk) {
                    //SeloAutenticado("erro");
                }
                else {
                    SeloAutenticado("nada");
                }

                return;
            }

            SeloAutenticado("loading");

            CheckoutNovo.AutenticarEmail(GlobalCheckout.dadosCheckout.Oferta.CodOferta, email, origem, function (res) {
                GlobalCheckout.loginMO = res.value;

                SeloAutenticado('nada');

                if (mostrarOk) {
                    if (GlobalCheckout.loginMO.CodCliente > 0) {
                        SeloAutenticado("ok");

                        if (GlobalCheckout.loginMO.PossuiCredito) {
                            if (!GlobalCheckout.loginMO.Autenticado) {
                                // PerguntarSenha();
                            }
                        }
                    }
                }

                if (GlobalCheckout.loginMO.ValoresPromocionais != null) {

                    GlobalCheckout.dadosCheckout.ValoresPromocionais = GlobalCheckout.loginMO.ValoresPromocionais;
                }

                //AtualizarTotais();
            });
        }

        var Autentificar = function () {
            if (GlobalCheckout.dadosCheckout.Login != null && GlobalCheckout.dadosCheckout.Login.Email != null) {
                if (GlobalCheckout.dadosCheckout.Login.Email.length > 0) {
                    $('#txtEmail').val(GlobalCheckout.dadosCheckout.Login.Email);
                    SeloAutenticado("ok");
                }

                if (GlobalCheckout.dadosCheckout.Login.PossuiCredito && !GlobalCheckout.dadosCheckout.Login.Autenticado) {
                    // PerguntarSenha();
                }
            }
        }

        var PerguntarSenha = function () {
            evModal('#pedirSenha');
            $('#emailConta').text($('#txtEmail').val());
            $('#btnLogar').click(FazerLogin);

            //evModal('#exibiCredito');
            //$('#saldoCredito').show();

            //$('#spanCredito').html(GlobalCheckout.dadosCheckout.Login.ValorTotalCredito);
            //$('#vlrCredito').html(GlobalCheckout.dadosCheckout.Login.ValorTotalCredito);

            $('#close-panel-senha').click(function () {
                $('#txtEmail').val('').focus();
                SeloAutenticado('nada');
                $('#pedirSenha').fadeOut();
                $('#mask').fadeOut();

                GlobalCheckout.loginMO = null;
            });
        }

        var FazerLogin = function (e) {
            e.preventDefault();
            $('#btnLogar').removeClass('btnLogar').addClass('loadingBtnLogar').prop('disabled', true);

            var email = $('#txtEmail').val();
            var senha = $('#txtSenha').val();
            var idFacebook = 0;

            CheckoutNovo.FazerLogin(GlobalCheckout.dadosCheckout.Oferta.CodOferta, email, senha, idFacebook, function (res) {
                if (res.value != null) {
                    GlobalCheckout.loginMO = res.value;

                    if (GlobalCheckout.loginMO != null && GlobalCheckout.loginMO.Autenticado) {
                        $('#pedirSenha').fadeOut();

                        $('#txtSenha').val();
                        $('#btnLogar').removeClass('loadingBtnLogar').addClass('btnLogar').prop('disabled', false);
                        $('#mask').fadeOut();
                        $("#btnLogar").unbind("click");
                        $('#close-panel-senha').unbind("click");
                        AtualizarTotais();
                    }
                    else {
                        alert('Autenticacao Incorreta');
                        $('#btnLogar').removeClass('loadingBtnLogar').addClass('btnLogar').prop('disabled', false);
                    }
                }
            });
        }

        var ValidaDadosCpf = function (elemento) {
            //debugger;
            var el = $('#' + elemento);

            if (el.is(':visible') && !ValidaCPF(el.val())) {
                alert('Digite o seu CPF');
                el.css('border', '1px solid Red');
                el.focus();
                return false;
            } else {
                el.css('border', '1px solid #ccc');
                return true;
            }
        }

        var ValidaDadosTelefone = function () {
            //debugger;
            if ($('#txtTelefoneContato').is(':visible') && !$('#txtTelefoneContato').val()) {
                alert('Digite o Celular');
                $('#txtDDD').css('border', '1px solid Red');
                $('#txtTelefoneContato').css('border', '1px solid Red');
                //$('#txtDDD').focus();
                return false;
            }

            return true;
        }

        var realizarCompraDenovo;
        var Comprar = function () {
            //debugger;
            var dadosValidos = false;
            var dadosValidosCPF = false;

            //if (ValidaCPFPagamentoSorocred($('#cpfTitular').val(), "cpfTitular")) {
            //    if (!ValidaCPF($('#cpfTitular').val())) {
            //        alert('Digite o seu CPF');
            //        $('#cpfTitular').css('border', '1px solid Red');
            //        $('#cpfTitular').focus();
            //        dadosValidosCPF = false;
            //    } else {
            //        $('#cpfTitular').css('border', '1px solid #ccc');
            //        dadosValidosCPF = true;
            //    };
            //} else {
            //    $('#cpfTitular').css('border', '1px solid #ccc');
            //    dadosValidosCPF = true;
            //}

            dadosValidosCPF = ValidaDadosCpf('cpfTitular');

            if ($('#rdoCartao').is(':checked')) {
                dadosValidos = ValidaDadosCartaoCredito()
            }
            else if ($('#rdoMercadoPago').is(':checked') || $('#rdoPagSeguro').is(':checked')) {
                dadosValidos = ValidaInformacoesEndereco(opcaoPagamento);
            }
            else if ($('#rdoCredito').is(':checked')) {
                dadosValidos = true;
            }
            else if ($('#rdoPix').is(':checked')) {
                dadosValidosCPF = ValidaDadosCpf('cpfTitularPix');

                if (ValidaDadosTelefone()) {
                    dadosValidos = ValidarDadosPix();
                }
            }

            if (dadosValidos && $('#chkTermosECondicoes').length > 0 && $('#chkTermosECondicoes').is(':checked') == false) {
                dadosValidos = false;
                alert("Confirme a leitura dos termos e condições.");
            }

            //debugger;
            if (dadosValidos && dadosValidosCPF) {
                var objCompra = MontarObjetoCompra();

                MostrarLoading();

                CheckoutNovo.ComprarCompleto(GlobalCheckout.dadosCheckout.Oferta.CodOferta, objCompra, false, function (res) {
                    if (res.value != null) {
                        if (res.value.Sucesso) {
                            if (res.value.Codigo > 0)
                                (new VerificarSituacaoPix(objCompra, res.value)).GetStatus();
                            else
                                GravarTrackersCompra(objCompra, res.value);
                        }
                        else {

                            if (res.value.MensagemErro === "Compra realizada a menos de 5 minutos atrás") {
                                var result =
                                    confirm("Compra realizada a menos de 5 minutos atrás, deseja realizar nova compra?");
                                if (result) {
                                    CheckoutNovo.ComprarCompleto(GlobalCheckout.dadosCheckout.Oferta.CodOferta,
                                        objCompra,
                                        true,
                                        function (res2) {
                                            if (res2.value != null) {
                                                if (res2.value.Sucesso) {
                                                    if (res2.value.Codigo > 0)
                                                        (new VerificarSituacaoPix(objCompra, res2.value)).GetStatus();
                                                    else
                                                        GravarTrackersCompra(objCompra, res2.value);

                                                } else {
                                                    alert(res2.value.MensagemErro);
                                                    EsconderLoading();
                                                }
                                            } else {
                                                alert(
                                                    'Ocorreu um erro durante o processo de pagamento, entre em contato com nossa central de relacionamento.');
                                                EsconderLoading();
                                            }
                                        });
                                } else {
                                    alert("Ação cancelada.");
                                    EsconderLoading();
                                    return;
                                }
                            } else {
                                alert(res.value.MensagemErro);
                                EsconderLoading();

                                if ($('#rdoPix').is(':checked')) {
                                    (new VerificarSituacaoPix(objCompra, res.value)).OcultarDadosPix();
                                }
                            }
                        }
                    }
                    else {
                        alert('Ocorreu um erro durante o processo de pagamento, entre em contato com nossa central de relacionamento.');
                        EsconderLoading();
                    }
                });
            }
        }
        //#endregion METODOS

        //#region HANDLERS

            $('#txtEmail').keyup(function () {
                $('.blocoEmail').find('.aprovado').addClass('oculto');
                $('.blocoEmail').find('.autenticarLoading').addClass('oculto');
                GlobalCheckout.loginMO = null;

                var email = this.value;

                if (intervalLogin) {
                    clearTimeout(intervalLogin);
                    intervalLogin = null;
                }

                if (VerificarEmail(email) && (email.match("\.com$") || email.match("\.com\.br$"))) {
                    // CHAMA O AUTENTICADOR DEPOIS DE 2 SEGUNDOS
                    intervalLogin = setTimeout(AutenticarEmail, 1000, email, 22);
                }
            });

        $('#txtEmail').blur(function () {
            if (GlobalCheckout.loginMO == null) {
                if (intervalLogin) {
                    clearTimeout(intervalLogin);
                    intervalLogin = null;
                }

                AutenticarEmail($('#txtEmail').val(), 22, true);
            }

            if (GlobalCheckout.loginMO != null) {
                if (GlobalCheckout.loginMO.CodCliente > 0) {
                    if (GlobalCheckout.loginMO.PossuiCredito && !GlobalCheckout.loginMO.Autenticado) {
                        // PerguntarSenha();
                    }

                    SeloAutenticado("ok");
                }
            }
        });

        //#endregion HANDLERS

        ////////////////////////
        // FORMA DE PAGAMENTO //
        ////////////////////////

        //#region HANDLERS

        $('#txtNumeroCartao').on('change', function (event) {
            ValidaCPFPagamentoSorocred(event.currentTarget.value, 'cpfTitular');
        });

        $('#txtNumeroCartao').keypress(function (event) {
            if (event.which != 8 && isNaN(String.fromCharCode(event.which))) {
                event.preventDefault();
            }

            ValidaCPFPagamentoSorocred(event.currentTarget.value, 'cpfTitular')
        });

        $('#codSegurancaCartao').keypress(function (event) {
            if (event.which != 8 && isNaN(String.fromCharCode(event.which))) {
                event.preventDefault();
            }
        });

        var OnlyNumbers = function (event) {
            if (event.which != 8 && isNaN(String.fromCharCode(event.which))) {
                event.preventDefault();
            }
        };

        var minLength = function (event) {
            //debugger;
            var el = $(event.target);

            if (!isNaN(el.attr('minlength')) && el.val().length < el.attr('minlength')) {
                $('input[minlength != ""]').off('blur', minLength);
                alert('Tamanho mínimo do campo: ' + el.attr('minlength'));
               // console.log('Tamanho mínimo do campo: ' + el.attr('minlength'));
                el.css('border', '1px solid #ff0000');
                el.focus();
                
                setTimeout(() => {
                    $('input[minlength != ""]').on('blur', minLength);
                }, 500);
            }
        };

        $('input[minlength != ""]').on('blur', minLength);

        //$('#txtDDD').on('keypress',OnlyNumbers);
        //$('#txtTelefoneContato').on('keypress',OnlyNumbers);
        $('#pagamento-fone').on('keypress',OnlyNumbers);

        //$('#txtDDD').keypress(function (event) {
        //    if (event.which != 8 && isNaN(String.fromCharCode(event.which))) {
        //        event.preventDefault();
        //    }
        //});

        //$('#txtTelefoneContato').keypress(function (event) {
        //    if (event.which != 8 && isNaN(String.fromCharCode(event.which))) {
        //        event.preventDefault();
        //    }
        //});

        $('#txtNomeTitular').keypress(function (event) {
            if (!/[a-záàâãéèêíïóôõöúçñ ]/i.test(String.fromCharCode(event.which))) {
                event.preventDefault();
            }
        });

        $('#codSegID').click(function (evt) {
            evt.preventDefault();
            $('.boxCodSeg').toggle();
        });

        $('#codSegFechar').click(function (evt) {
            evt.preventDefault();
            $('.boxCodSeg').hide();
        });


        $("input[type='radio'][name=meioPagamento]", "ul.payment-types").click(function () {
            let idTab = $(this).closest("li").attr("id");
            let infoName = "info" + idTab[0].toUpperCase() + idTab.slice(1);
            let idRadio = $(this).attr("id");

            //Desativar / Ativar abas
            $("li", "ul.payment-types").removeClass("ativo");
            $(this).closest("li").addClass("ativo");

            //Ocultar informações de pagamento
            $(".infoMeioPagamento", "div.blocoMeiosPagamento")
                .filter(function (ix, item) { return $(item).hasClass("oculto") == false; })
                .addClass("oculto");

            //Ativar informações de pagamento para a opção escolhida.
            $(".infoMeioPagamento", "div.blocoMeiosPagamento")
                .filter(function (ix, item) { return $(item).hasClass(infoName); }).removeClass("oculto");

            //Executar método popular dados.
            ["rdoMercadoPago", "rdoPagSeguro"]
                .filter(function (item) { return item == idRadio; })
                .forEach(function () { PopulaDados(); })

            //Apresentar valor entrada Pix
            if (idRadio === "rdoPix")
                $("#valorCobradoPix").text("R$ " + $('#condPagamento').find('option:selected').attr('totalcomjuros'));


        });

        /*
                $('#rdoCartao').click(function () {
                    $('.infoMercadoPago').addClass('oculto');
                    $('.infoPagSeguro').addClass('oculto');
                    $('.infoCartao').removeClass('oculto');
        
                    $('#mercadoPago').removeClass('ativo');
                    $('#pagSeguro').removeClass('ativo');
                    $('#cartao').addClass('ativo');
        
                });
        
                $('#rdoMercadoPago').click(function () {
                    $('.infoCartao').addClass('oculto');
                    $('.infoPagSeguro').addClass('oculto');
                    $('.infoMercadoPago').removeClass('oculto');
        
                    $('#cartao').removeClass('ativo');
                    $('#pagSeguro').removeClass('ativo');
                    $('#mercadoPago').addClass('ativo');
        
                    PopulaDados();
                });
        
                $('#rdoPagSeguro').click(function () {
                    $('.infoCartao').addClass('oculto');
                    $('.infoMercadoPago').addClass('oculto');
                    $('.infoPagSeguro').removeClass('oculto');
        
                    $('#cartao').removeClass('ativo');
                    $('#mercadoPago').removeClass('ativo');
                    $('#pagSeguro').addClass('ativo');
        
                    PopulaDados();
                });
        */

        $('.txtCEP').keypress(function (event) {
            if (event.which != 8 && isNaN(String.fromCharCode(event.which))) {
                event.preventDefault(); //enquanto não for número retorna a digitação
            }
        });

        $('.txtCEP').change(function () {
            var cep = $.trim(opcaoPagamento.find('.txtCEP').val());

            if (cep.length == 8) {
                PegarEnderecoCep(cep);
            } else {
                alert('Digite corretamente o CEP');
            }
        });

        $('.txtCPF').keypress(function (event) {
            if (event.which != 8 && isNaN(String.fromCharCode(event.which))) {
                event.preventDefault(); //enquanto não for número retorna a digitação
            }
        });

        $('.txtCPF').change(function () {
            var cpf = $.trim(opcaoPagamento.find('.txtCPF').val());

            if (!ValidaCPF(cpf)) {
                alert('Digite o seu CPF');
                opcaoPagamento.find('.txtCPF').css('border', '1px solid Red');
                opcaoPagamento.find('.txtCPF').focus();
                return false;
            } else {
                opcaoPagamento.find('.txtCPF').css('border', '1px solid #ccc');
            };
        });

        $('#cpfTitular').keypress(function (event) {
            if (event.which != 8 && isNaN(String.fromCharCode(event.which))) {
                event.preventDefault(); //enquanto não for número retorna a digitação
            }
        });

        $('#cpfTitular').change(function () {
            var cpf = $.trim($('#cpfTitular').val());

            if (!ValidaCPF(cpf)) {
                alert('Digite o seu CPF');
                $('#cpfTitular').css('border', '1px solid Red');
                $('#cpfTitular').focus();
                return false;
            } else {
                $('#cpfTitular').css('border', '1px solid #ccc');
            };
        });

        $('#cpfTitularPix').keypress(function (event) {
            if (event.which != 8 && isNaN(String.fromCharCode(event.which))) {
                event.preventDefault(); //enquanto não for número retorna a digitação
            }
        });

        $('#cpfTitularPix').change(function () {
            var cpf = $.trim($('#cpfTitularPix').val());

            if (!ValidaCPF(cpf)) {
                alert('Digite o seu CPF');
                $('#cpfTitularPix').css('border', '1px solid Red');
                $('#cpfTitularPix').focus();
                return false;
            } else {
                $('#cpfTitularPix').css('border', '1px solid #ccc');
            };
        });

        $('.txtDataNascimento').keypress(function (event) {
            if (event.which != 8 && isNaN(String.fromCharCode(event.which))) {
                event.preventDefault(); //enquanto não for número retorna a digitação
            }
        });

        $('.txtDataNascimento').mask('99/99/9999');

        $("input[type='text']").change(function () {
            PopulaDadosEnderecoCliente();
        });

        $(document).keypress(function (e) {
            if (e.which == 13) {
                e.preventDefault();
                Comprar();
            }
        });

        $('.btnComprar').on('click', function () {
            //debugger;
            Comprar();
        });


        //$('#btnCopiar').on('click', function () {
        //    let qrCode = $("#hdQrCode").val();
        //    let type = "text/plain";
        //    var blob = new Blob([qrCode], { type });
        //    var data = [new ClipboardItem({ [type]: blob })];

        //    navigator.clipboard.write(data).then(
        //        function () {
        //            alert("Cópia realizada com sucesso");
        //        },
        //        function (err) {
        //            console.log(err);
        //            alert("Falha ao realizar a cópia");
        //        }
        //    );
        //});

        $('.qrcode-copy').on('click', function () {
            CopyQRCode();
        });


        $('#btnCadastroOfertaEncerrada').on('click', function () {
            $(this).hide();
            $('.aguardeEncerrada').show();
            $('.lblErroEmail').hide();

            var email = $('.txtEmailOfertaEncerrada').val();
            var codOferta = parseInt($('#hdnCodOferta').val());

            if (!VerificarEmail(email)) {
                $('.txtEmailOfertaEncerrada').val('');
                $('.txtEmailOfertaEncerrada').focus();
                $('.lblErroEmail').show();

                $('.aguardeEncerrada').hide();
                $(this).show();

                alert('Digite corretamente o seu email.');
                return;
            } else {
                CheckoutNovo.EnviarEmailInteresseOfertaEncerrada(email, codOferta, function (res) {
                    if (res.value.Sucesso) {
                        $('.aguardeEncerrada').hide();
                        $('#btnCadastroOfertaEncerrada').show();
                        alert(res.value.Mensagem);
                        window.location.href = res.value.UrlRedirect;
                    } else {
                        $('.aguardeEncerrada').hide();
                        $('#btnCadastroOfertaEncerrada').show();
                        alert(res.value.Mensagem);
                    }
                });
            }
        });

        //#endregion HANDLERS

        //#region MÉTODOS
        var CopyQRCode = function () {
            let qrCode = $("#hdQrCode").val();
            let type = "text/plain";
            var blob = new Blob([qrCode], { type });
            var data = [new ClipboardItem({ [type]: blob })];

            navigator.clipboard.write(data).then(
                function () {
                    alert("Cópia realizada com sucesso");
                },
                function (err) {
                    console.log(err);
                    alert("Falha ao realizar a cópia");
                }
            );
        };


        var AtualizarValoresPagamento = function (objValorAPagar) {
            var valorAPagar = !objValorAPagar || objValorAPagar.totalPagar == null || objValorAPagar.totalPagar < 0 ? 0 : objValorAPagar.totalPagar;

            var numeroParcelas;
            var coeficiente;
            var valorParcela;
            var valorTotal;
            var textoOption;
            var maxParcelas = GlobalCheckout.dadosCheckout.ConfiguracoesCartao['MaxParcelas'];
            GlobalCheckout.dadosCheckout.FlagOneTime = objValorAPagar.flagOneTime;

            var p = $('#condPagamento').parent();
            $('#condPagamento').remove();

            var selectCondicao = $('<select>').attr('id', 'condPagamento');
            p.append(selectCondicao)

            if (valorAPagar > 0) {
                optionParcela = $('<option>').attr("selected", "selected");
                selectCondicao.append(optionParcela.attr('value', '1').attr('totalComJuros', Globalize.format(valorAPagar, "n2")).text(Globalize.format(valorAPagar, 'c2') + ' à vista'));

                $('#valorCobradoCartao').text(Globalize.format(valorAPagar, 'c2'));


                if (GlobalCheckout.dadosCheckout.ConfiguracoesCartao.MaxParcelas <= 1) {

                    $('.labelParcelasPagamento').text('Valor que será debitado');
                }


                if (GlobalCheckout.dadosCheckout.ConfiguracoesCartao.JurosCartao.length > 0) {
                    for (var i = 0; i < GlobalCheckout.dadosCheckout.ConfiguracoesCartao.JurosCartao.length; i++) {
                        var optionParcela = $('<option>');

                        numeroParcelas = GlobalCheckout.dadosCheckout.ConfiguracoesCartao.JurosCartao[i]['NumeroParcelas'];
                        coeficiente = GlobalCheckout.dadosCheckout.ConfiguracoesCartao.JurosCartao[i]['Coeficiente'];

                        if (coeficiente == 0) {
                            valorParcela = valorAPagar / numeroParcelas;
                        }
                        else {
                            valorParcela = valorAPagar * coeficiente;
                        }

                        valorTotal = valorParcela * numeroParcelas;

                        textoOption = ' ' + numeroParcelas + 'x ' + Globalize.format(valorParcela, "c2") + ' (' + Globalize.format(valorTotal, "c2") + ')';

                        selectCondicao.append(optionParcela.attr('value', numeroParcelas).attr('totalComJuros', Globalize.format(valorTotal, "n2")).text(textoOption));
                    }
                }

                $('.infoCartao').removeClass('oculto');
                $('.infoMercadoPago').addClass('oculto');
                $('.infoPagSeguro').addClass('oculto');
                $('.infoCredito').addClass('oculto');

                $("#rdoCartao").prop("checked", true);
                $("#rdoPix").prop("checked", false);

                $("#rdoMercadoPago").prop("checked", false);
                $("#rdoPagSeguro").prop("checked", false);
                $("#rdoCredito").prop("checked", false);

                $('#cartao').show();
                $('#mercadoPago').show();
                $('#pagseguro').show();
                $('#credito').hide();
            }
            else {
                $('.infoMercadoPago').addClass('oculto');
                $('.infoPagSeguro').addClass('oculto');
                $('.infoCartao').addClass('oculto');
                $('.infoCredito').removeClass('oculto');

                $('#cartao').hide();
                $('#mercadoPago').hide();
                $('#pagseguro').hide();
                $('#pix').hide(); //Todo: Validar
                $('#credito').show();

                $("#rdoCredito").prop("checked", true);
                $("#rdoCartao").prop("checked", false);
                $("#rdoPix").prop("checked", false);
                $("#rdoMercadoPago").prop("checked", false);
                $("#rdoPagSeguro").prop("checked", false);

                optionParcela = $('<option>').attr("selected", "selected");
                selectCondicao.append(optionParcela.attr('value', '1').text(Globalize.format(valorAPagar, 'c2') + ' à vista'));
            }

            //$(selectCondicao).menuDropMobile();
            // iOS hack: Adiciona um optgroup para cada select pra evitar truncar opções com texto longo
            if (navigator.userAgent.match(/(iPad|iPhone|iPod touch)/i)) {
                $(selectCondicao).ajustaDropApple();
            }
        }

        var PopulaDadosEnderecoCliente = function () {
            DefineOpcaoPagamento();

            var nome = opcaoPagamento.find('.txtEndNome');
            var cpf = opcaoPagamento.find('.txtCPF');
            var ddd = opcaoPagamento.find('.txtDDD');
            var telefone = opcaoPagamento.find('.txtTelefone');

            cliente = {
                Nome: nome.val(),
                CPF: cpf.val() || $('#cpfTitular').val(),
                DDD: ddd.val(),
                Telefone: telefone.val()
            }

            var cep = opcaoPagamento.find('.txtCEP');
            var endereco = opcaoPagamento.find('.txtEndereco');
            var numero = opcaoPagamento.find('.txtNumero');
            var complemento = opcaoPagamento.find('.txtComplemento');
            var bairro = opcaoPagamento.find('.txtBairro');
            var cidade = opcaoPagamento.find('.txtCidade');
            var estado = opcaoPagamento.find('.UF');

            enderecoCompleto = {
                CEP: cep.val(),
                Endereco: endereco.val(),
                Numero: numero.val(),
                Complemento: complemento.val(),
                Bairro: bairro.val(),
                Cidade: cidade.val(),
                Estado: estado.val()
            }
        }

        var PopulaDados = function () {
            DefineOpcaoPagamento();

            if ($(cliente).length > 0 || $(enderecoCompleto).length > 0) {
                opcaoPagamento.find('.txtEndNome').val(cliente.Nome);
                opcaoPagamento.find('.txtCPF').val(cliente.CPF);
                opcaoPagamento.find('.txtDDD').val(cliente.DDD);
                opcaoPagamento.find('.txtTelefone').val(cliente.Telefone);
                opcaoPagamento.find('.txtCEP').val(enderecoCompleto.CEP);
                opcaoPagamento.find('.txtEndereco').val(enderecoCompleto.Endereco);
                opcaoPagamento.find('.txtNumero').val(enderecoCompleto.Numero);
                opcaoPagamento.find('.txtComplemento').val(enderecoCompleto.Complemento);
                opcaoPagamento.find('.txtBairro').val(enderecoCompleto.Bairro);
                opcaoPagamento.find('.txtCidade').val(enderecoCompleto.Cidade);
            }
        }

        var PegarEnderecoCep = function (cep) {
            CheckoutNovo.PegarEnderecoCep(cep, function (res) {
                if (res.value != null) {
                    var endereco = res.value;

                    $('.txtEndNome');

                    opcaoPagamento.find('.txtCEP').val(cep);
                    opcaoPagamento.find('.txtEndereco').val(endereco.Tipo + ": " + endereco.Nome);
                    opcaoPagamento.find('.txtNumero');
                    opcaoPagamento.find('.txtBairro').val(endereco.Bairro);
                    opcaoPagamento.find('.txtCidade').val(endereco.Cidade);

                    for (var i = 0; i < opcaoPagamento.find('.UF').find('option').length; i++) {
                        if (opcaoPagamento.find('.UF').find('option')[i]["value"] == endereco.UF) {
                            $(opcaoPagamento.find('.UF').find('option')[i]).attr('selected', 'selected');
                        }
                    }

                    PopulaDadosEnderecoCliente();
                }
            });
        }

        var ValidaDadosCartaoCredito = function () {
            var nomeTitular = $('#txtNomeTitular').val();
            var mes = $('#mesCartao').find('option:selected').val();
            var ano = $('#anoCartao').find('option:selected').val();
            var codSeguranca = $('#codSegurancaCartao').val();
            var condPagamento = $('#condPagamento').find('option:selected').val();

            $('#txtEmail').css('border', '1px solid #ccc');
            $('#txtNumeroCartao').css('border', '1px solid #ccc').attr('autocomplete', 'off');
            $('#txtNomeTitular').css('border', '1px solid #ccc');
            $('#mesCartao').css('border', '1px solid #ccc');
            $('#anoCartao').css('border', '1px solid #ccc');
            $('#codSegurancaCartao').css('border', '1px solid #ccc');

            //// VALIDA O EMAIL
            if (!VerificarEmail(GlobalCheckout.loginMO.Email)) {
                alert('Preencha corretamente o seu email.');
                return false;
            }

            if (nomeTitular == null || nomeTitular == '') {
                alert('Preencha nome e sobrenome do titular do cartão.');
                $('#txtNomeTitular').css('border', '1px solid Red');
                $('#txtNomeTitular').focus();

                return false;
            }

            if (!/ [a-záàâãéèêíïóôõöúçñ]/i.test(nomeTitular)) {
                alert('É necessário preencher o sobrenome do titular do cartão.');
                $('#txtNomeTitular').css('border', '1px solid Red');
                $('#txtNomeTitular').focus();

                return false;
            }

            if (!ValidarCartaoCredito($('#txtNumeroCartao').val())) {
                alert('Digite corretamente os números do cartão de crédito.');
                $('#txtNumeroCartao').css('border', '1px solid Red');
                $('#txtNumeroCartao').focus();
                return false;
            }

            var data = new Date();
            var anoAtual = data.getFullYear();
            var mesAtual = data.getMonth() + 1;

            if (mes == 0) {
                alert('Selecione corretamente o mês.');
                $('#mesCartao').css('border', '1px solid Red');
                $('#mesCartao').focus();
                return false;
            }
            else if (mes > 0 && ano == 0) {
                alert('Selecione corretamente o ano.');
                $('#anoCartao').css('border', '1px solid Red');
                $('#anoCartao').focus();
                return false;
            }

            if (mes < mesAtual && ano <= anoAtual) {
                alert('Selecione corretamente o mês.');
                $('#mesCartao').css('border', '1px solid Red');
                $('#mesCartao').focus();
                return false;
            }

            if (ano < anoAtual) {
                alert('Selecione corretamente o ano.');
                $('#anoCartao').css('border', '1px solid Red');
                $('#anoCartao').focus();
                return false;
            }

            if (codSeguranca.length < 3 || codSeguranca == '' || codSeguranca == null) {
                alert('Digite corretamente o número de segurança.');
                $('#codSegurancaCartao').css('border', '1px solid Red');
                $('#codSegurancaCartao').focus();
                return false;
            }

            //if ($('#txtDDD').val() < 2 || $('#txtDDD').val() == '' || $('#txtDDD').val() == null) {
            //    alert('Digite corretamento o número o DDD.');
            //    $('#txtDDD').css('border', '1px solid Red');
            //    $('#txtDDD').focus();
            //    return false;
            //}

            //if ($('#txtTelefoneContato').val() < 8 || $('#txtTelefoneContato').val() == '' || $('#txtTelefoneContato').val() == null) {
            //    alert('Digite corretamento o telefone de contato.');
            //    $('#txtTelefoneContato').css('border', '1px solid Red');
            //    $('#txtTelefoneContato').focus();
            //    return false;
            //}

            return true;
        }

        var ValidaInformacoesEndereco = function (fieldsetAtual) {
            var nome = fieldsetAtual.find('.txtEndNome');
            var cpf = fieldsetAtual.find('.txtCPF');
            var ddd = fieldsetAtual.find('.txtDDD');
            var telefone = fieldsetAtual.find('.txtTelefone');
            var cep = fieldsetAtual.find('.txtCEP');
            var endereco = fieldsetAtual.find('.txtEndereco');
            var numero = fieldsetAtual.find('.txtNumero');
            var complemento = fieldsetAtual.find('.txtComplemento');
            var bairro = fieldsetAtual.find('.txtBairro');
            var cidade = fieldsetAtual.find('.txtCidade');
            var estado = fieldsetAtual.find('.UF');
            var dataNascimento = fieldsetAtual.find('.txtDataNascimento');
            var sexo = fieldsetAtual.find('.genero');

            nome.css('border', '1px solid #CCC');
            cpf.css('border', '1px solid #CCC');
            ddd.css('border', '1px solid #CCC');
            telefone.css('border', '1px solid #CCC');
            cep.css('border', '1px solid #CCC');
            endereco.css('border', '1px solid #CCC');
            numero.css('border', '1px solid #CCC');
            bairro.css('border', '1px solid #CCC');
            cidade.css('border', '1px solid #CCC');
            estado.css('border', '1px solid #CCC');
            dataNascimento.css('border', '1px solid #CCC');
            sexo.css('border', '1px solid #CCC');

            // Nome é Obrigatório ter Sobre nome
            if ($.trim(nome.val()).split(' ').length <= 1) {
                alert('Informe seu Nome e Sobrenome');
                nome.focus();
                nome.css('border', '1px solid Red');

                return false;
            }
            if (!ValidaCPF($.trim(cpf.val()))) {
                alert('Informe o seu CPF.');
                cpf.focus();
                cpf.css('border', '1px solid Red');

                return false;
            }
            if (dataNascimento.val() == 0) {
                alert('Informe a sua data de nascimento.');
                dataNascimento.focus();
                dataNascimento.css('border', '1px solid Red');

                return false;
            }
            if (sexo.val() == 0) {
                alert('Informe o sexo.');
                sexo.focus();
                sexo.css('border', '1px solid Red');

                return false;
            }
            if ($.trim(ddd.val()).length != 2) {
                alert('Informe corretamente o DDD.');
                ddd.focus();
                ddd.css('border', '1px solid Red');

                return false;
            }
            if ($.trim(telefone.val()).length < 8) {
                alert('Informe corretamente seu telefone.');
                telefone.focus();
                telefone.css('border', '1px solid Red');

                return false;
            }
            if ($.trim(cep.val()).length < 8) {
                alert('Informe o CEP.');
                cep.focus();
                cep.css('border', '1px solid Red');

                return false;
            }
            if ($.trim(endereco.val()).length == 0) {
                alert('Informe o Endereco.');
                endereco.focus();
                endereco.css('border', '1px solid Red');

                return false;
            }
            if ($.trim(numero.val()).length == 0 || $.trim(numero.val()).length >= 10) {
                alert('Informe corretamento o número.');
                numero.focus();
                numero.css('border', '1px solid Red');

                return false;
            }
            if ($.trim(bairro.val()).length == 0) {
                alert('Informe o bairro.');
                bairro.focus();
                bairro.css('border', '1px solid Red');

                return false;
            }
            if ($.trim(cidade.val()).length == 0) {
                alert('Informe a cidade.');
                cidade.focus();
                cidade.css('border', '1px solid Red');

                return false;
            }

            if (estado.val() == 0) {
                alert('Selecione o Estado.');
                estado.focus();
                estado.css('border', '1px solid Red');

                return false;
            }

            return true;
        };

        var ValidarDadosPix = function () {

            var emailUser = $("input", "div.blocoEmail").val();
            //GlobalCheckout.loginMO.Email

            if (!VerificarEmail(emailUser)) {

                alert('Preencha corretamente o seu email.');

                $("input", "div.blocoEmail").css('border', '1px solid Red');
                $("input", "div.blocoEmail").focus();

                return false;
            }

            return true;

        }

        var DefineOpcaoPagamento = function () {
            var fieldsetAtual;

            if ($('#rdoPagSeguro').is(':checked')) fieldsetAtual = $('.infoPagSeguro').find('fieldset');
            else fieldsetAtual = $('.infoMercadoPago').find('fieldset');

            opcaoPagamento = fieldsetAtual;
            //PopulaDadosEnderecoCliente();
            //ValidaInformacoesEndereco(fieldsetAtual);
        };

        var MontarObjetoCompra = function () {
            var dadosPagamento;

            var codCliente = 0;

            if (GlobalCheckout.loginMO != null) codCliente = GlobalCheckout.loginMO.CodCliente;
            var cliente = {};

            if ($('#rdoCartao').is(':checked')) {
                var bandeiraCartao = RetornarBandeiraCartao($('#txtNumeroCartao').val());
                var totalComJuros = $('#condPagamento').find('option:selected').attr('totalcomjuros');

                // SE A BANDEIRA FOR 0
                // A COMPRA ESTÁ SENDO REALIZADA COM 100% DE CRÉDITOS

                dadosPagamento = {
                    FormaDePagamento: 12,
                    NumeroCartao: $('#txtNumeroCartao').val(),
                    NomeTitular: $('#txtNomeTitular').val(),
                    MesVencimento: $('#mesCartao').val(),
                    AnoVencimento: $('#anoCartao').val(),
                    CodSeguranca: $('#codSegurancaCartao').val(),
                    CpfTitular: $('#cpfTitular').val(),
                    NumeroParcelas: $('#condPagamento').val(),
                    BandeiraCartao: bandeiraCartao.codBandeira,
                    ValorTotalAPagarComJuros: Globalize.parseFloat(totalComJuros)
                };

                cliente = { CodCliente: codCliente, Email: GlobalCheckout.loginMO.Email, Nome: $('#txtNomeTitular').val(), Cpf: $('#cpfTitular').val() };
            }
            else if ($('#rdoMercadoPago').is(':checked')) {
                dadosPagamento = {
                    FormaDePagamento: 2
                }

                cliente = {
                    CodCliente: codCliente,
                    Nome: $('div.infoMercadoPago fieldset p.nome input').val(),
                    CEP: $('div.infoMercadoPago fieldset p.cep input').val(),
                    Endereco: $('div.infoMercadoPago fieldset p.endereco input').val(),
                    Numero: $('div.infoMercadoPago fieldset p.numero input').val(),
                    Bairro: $('div.infoMercadoPago fieldset p.bairro input').val(),
                    Cidade: $('div.infoMercadoPago fieldset p.cidade input').val(),
                    UF: $('div.infoMercadoPago fieldset p.estado select').val(),
                    DDD: $('div.infoMercadoPago fieldset p.ddd input').val(),
                    Telefone: $('div.infoMercadoPago fieldset p.fone input').val(),
                    Complemento: $('div.infoMercadoPago fieldset p.complemento input').val(),
                    Cpf: $('div.infoPagSeguro fieldset p.cpf input').val() || $('#cpfTitular').val(),
                    Email: GlobalCheckout.loginMO.Email,
                    Sexo: $('div.infoMercadoPago fieldset p.boxGenero select').val(),
                    DataNascimento: Globalize.parseDate($('div.infoMercadoPago fieldset p.dataNascimento input').val())
                };
            }
            else if ($('#rdoPagSeguro').is(':checked')) {
                dadosPagamento = {
                    FormaDePagamento: 1
                }

                cliente = {
                    CodCliente: codCliente,
                    Nome: $('div.infoPagSeguro fieldset p.nome input').val(),
                    CEP: $('div.infoPagSeguro fieldset p.cep input').val(),
                    Endereco: $('div.infoPagSeguro fieldset p.endereco input').val(),
                    Numero: $('div.infoPagSeguro fieldset p.numero input').val(),
                    Bairro: $('div.infoPagSeguro fieldset p.bairro input').val(),
                    Cidade: $('div.infoPagSeguro fieldset p.cidade input').val(),
                    UF: $('div.infoPagSeguro fieldset p.estado select').val(),
                    DDD: $('div.infoPagSeguro fieldset p.ddd input').val(),
                    Telefone: $('div.infoPagSeguro fieldset p.fone input').val(),
                    Complemento: $('div.infoPagSeguro fieldset p.complemento input').val(),
                    Cpf: $('div.infoPagSeguro fieldset p.cpf input').val() || $('#cpfTitular').val(),
                    Email: GlobalCheckout.loginMO.Email,
                    Sexo: $('div.infoPagSeguro fieldset p.boxGenero select').val(),
                    DataNascimento: Globalize.parseDate($('div.infoPagSeguro fieldset p.dataNascimento input').val())
                };
            }
            else if ($('#rdoCredito').is(':checked')) {
                dadosPagamento = {
                    FormaDePagamento: 7,
                    ValorTotalAPagarComJuros: 0
                };

                cliente = { CodCliente: codCliente, Email: GlobalCheckout.loginMO.Email };
            }
            else if ($('#rdoPix').is(':checked')) {
                let totalComJuros = $('#condPagamento').find('option:selected').attr('totalcomjuros');
                //debugger;
                dadosPagamento = {
                    FormaDePagamento: 29,
                    CpfTitular: $('#cpfTitularPix').val(),
                    DDDCelular: $('#txtDDD').val(),
                    Celular: $('#txtTelefoneContato').val(),
                    //ValorTotalAPagarComJuros: 0
                    ValorTotalAPagarComJuros: Globalize.parseFloat(totalComJuros)
                };

                cliente = {
                    CodCliente: codCliente,
                    Email: GlobalCheckout.loginMO.Email,
                    Cpf: $('#cpfTitularPix').val(),
                    DDDCelular: $('#txtDDD').val(),
                    Celular: $('#txtTelefoneContato').val(),
                };
            }

            var opcoes = [];
            var hoteis = [];

            if (GlobalCheckout.selectedOptions != null && GlobalCheckout.selectedOptions.length > 0) {
                var nomeOpcao = '';

                // CRIA UM VOUCHER POR QUANTIDADE
                for (var k = 0; k < GlobalCheckout.selectedOptions.length; k++) {
                    var currOption = GlobalCheckout.selectedOptions[k];

                    for (var q = 0; q < currOption.QuantidadeSelecionada; q++) {
                        var valorEntrada = currOption.ValorEntrada == 0 ? currOption.Valor : currOption.ValorEntrada;

                        var opcao = {
                            CodOfertaOpcao: currOption.CodOfertaOpcao,
                            ValorEntrada: valorEntrada,
                            ValorTotal: currOption.Valor,
                            ValorTaxas: currOption.ValorTaxa,
                            NomeVoucher: $('#txtNomeTitular').val(),
                            NumeroPassageiros: currOption.NumPassageiros,
                            NomeOpcao: nomeOpcao
                        }

                        opcoes.push(opcao);
                    }
                }
            }
            // SE FOR HOTEL
            else if (GlobalCheckout.dadosCheckout.Hoteis != null && GlobalCheckout.dadosCheckout.Hoteis.length > 0) {
                var hotel = {
                    CodOpcaoHotel: GlobalCheckout.dadosCheckout.Hoteis[0].CodOpcaoHotel,
                    CodConsolidadora: GlobalCheckout.dadosCheckout.Hoteis[0].Consolidadora.CodConsolidadora,
                    CodHotel: GlobalCheckout.dadosCheckout.Hoteis[0].CodHotel,
                    CodTipoQuarto: $('.CheckoutQuartosNovo').find('select').val(),
                    CodTipoCama: $('.CheckoutCamas').find('select').val(),
                    DataCheckin: Globalize.parseDate($('.DataCheckin').find('select').val()),
                    DataCheckout: Globalize.parseDate($('.DataCheckout').find('select').val()),
                    NomeHospede: $('#txtNomeTitular').val(),
                    ValorTotal: Globalize.parseFloat($('#totalCheckoutTotal').val(), $('#totalCheckoutTotal').data("culture")),
                    TotalTaxAmount: totalTaxAmount,
                    TotalValorSemTaxAmount: Globalize.parseFloat($('#totalCheckoutTotal').val(), $('#totalCheckoutTotal').data("culture")) - totalTaxAmount
                }
                hoteis.push(hotel);
            }

            var valorTotalAPagar = 0;
            var valorTotalPacote = 0;
            var valorCreditos = 0;
            var valorTotalAPagarSemDesconto = 0;

            if ($('div.quadroValores ul li.entrada ul li.valor span').length) {
                // COM ENTRADA
                valorTotalAPagar = Globalize.parseFloat($('div.quadroValores ul li.entrada ul li.valor span').text().replace('*', ''));
            }
            else {
                // SEM ENTRADA
                valorTotalAPagar = $('div.quadroValores ul li.total ul li.valor span').length > 0 ? Globalize.parseFloat($('div.quadroValores ul li.total ul li.valor span').text().replace('*', '')) : 0;
            }

            // PROMO
            var codigoPromocioal = (GlobalCheckout.dadosCheckout.ValoresPromocionais != null && GlobalCheckout.dadosCheckout.ValoresPromocionais.CodigoPromocional != null) ? GlobalCheckout.dadosCheckout.ValoresPromocionais.CodigoPromocional : "";

            valorDescontos = $('div.quadroValores ul li.descontos ul li.valor span').length > 0 ? Globalize.parseFloat($('div.quadroValores ul li.descontos ul li.valor span').text().replace('-', '').replace('*', '')) : 0;
            valorCreditos = $('div.quadroValores ul li.creditos ul li.valor span').length > 0 ? Globalize.parseFloat($('div.quadroValores ul li.creditos ul li.valor span').text().replace('-', '').replace('*', '')) : 0;
            valorTaxas = $('div.quadroValores ul li.totalTaxas ul li.valor span').length > 0 ? Globalize.parseFloat($('div.quadroValores ul li.totalTaxas ul li.valor span').text().replace('-', '').replace('*', '')) : 0;

            if (isNaN(taxasPacote)) taxasPacote = 0;
            if (!GlobalCheckout.dadosCheckout.Oferta.MostrarTaxas) valorTaxas = taxasPacote;

            valorTotalAPagarSemDesconto = Math.round((valorTotalAPagar + valorCreditos + valorDescontos) * 100) / 100;
            valorTotalPacote = $('div.quadroValores ul li.total ul li.valor span').length > 0 ? Globalize.parseFloat($('div.quadroValores ul li.total ul li.valor span').text().replace('*', '')) + valorCreditos + valorDescontos : 0;


            var DadosCompraMO = {
                DadosPagamento: dadosPagamento,
                Cliente: cliente,
                Login: GlobalCheckout.loginMO,
                Opcoes: opcoes,
                Trens: [],
                Carros: [],
                Aereos: [],
                Cruzeiros: [],
                Hoteis: hoteis,
                ApoliceSeguro: null,
                CodigoPromocional: codigoPromocioal,
                ValorTaxas: valorTaxas,
                ValorDesconto: valorDescontos,
                ValorTotalAPagarSemDesconto: valorTotalAPagarSemDesconto,
                ValorTotalAPagar: valorTotalAPagar,
                ValorTotalPacote: valorTotalPacote,
                Moeda: GlobalCheckout.dadosCheckout.Oferta.Moeda,
                FlagOneTime: GlobalCheckout.dadosCheckout.FlagOneTime
            };

            return DadosCompraMO;
        };

        var ValidarCartaoCredito = function (number) {
            if (number == null || number == undefined || number == "") return false;

            var bandeira = RetornarBandeiraCartao(number);

            if (bandeira.name == 'hipercard' || bandeira.name == 'elo' || bandeira.name == 'sorocred') {
                return true;
            }

            var digit, n, sum, _j, _len1, _ref2;
            sum = 0;
            _ref2 = number.split('').reverse();
            for (n = _j = 0, _len1 = _ref2.length; _j < _len1; n = ++_j) {
                digit = _ref2[n];
                digit = +digit;
                if (n % 2) {
                    digit *= 2;
                    if (digit < 10) {
                        sum += digit;
                    } else {
                        sum += digit - 9;
                    }
                } else {
                    sum += digit;
                }
            }
            return sum % 10 === 0;
        }

        var RetornarBandeiraCartao2 = function (number) {
            var _hipercardBins = ["606282", "384100", "384140", "384160"],
                _sorocredBins = ["627892"],
                _eloBins = ["401178", "401179", "431274", "438935", "451416", "457393", "457631", "457632",
                    "504175", "627780", "636297", "636368", "636369"],
                _eloBinRanges = [
                    [506699, 506778],
                    [509000, 509999],
                    [650031, 650033],
                    [650035, 650051],
                    [650405, 650439],
                    [650485, 650538],
                    [650541, 650598],
                    [650700, 650718],
                    [650720, 650727],
                    [650901, 650920],
                    [651652, 651679],
                    [655000, 655019],
                    [655021, 655058]
                ],
                _masterCardRanges = [222100, 272099];
            var _isInEloBinRanges = function (bin) {
                var numbin = parseInt(bin);
                for (var i = 0; i < _eloBinRanges.length; i++) {
                    var start = _eloBinRanges[i][0], end = _eloBinRanges[i][1];
                    if (numbin >= start && numbin <= end) return true;
                }
                return false;
            },
                _isInMasterCardRanges = function (bin) {
                    var numRange = parseInt(bin);
                    for (var i = 0; i < _masterCardRanges.length; i += 2) {
                        var startingRange = _masterCardRanges[i], endingRange = _masterCardRanges[i + 1];
                        if (numRange >= startingRange && numRange <= endingRange) return true;
                    }
                    return false;
                },
                getBin = function (cardNum) {
                    return cardNum.substring(0, 6);
                };
            var cardTypes = {
                'amex': function (cardNum) {
                    return /^3[4,7]\d{13}$/.test(cardNum) && cardNum.length == 15;
                },
                'hipercard': function (cardNum) {
                    return cardNum !== null &&
                        (cardNum.length == 16 || cardNum.length == 19) &&
                        _hipercardBins.indexOf(getBin(cardNum)) > -1;
                },
                'elo': function (cardNum) {
                    return cardNum !== null &&
                        cardNum.length >= 6 &&
                        (_eloBins.indexOf(getBin(cardNum)) > -1 ||
                            _isInEloBinRanges(getBin(cardNum)));
                },
                'diners_club_carte_blanche': function (cardNum) {
                    return /^3[0,6,8]\d{12}$/.test(cardNum);
                },
                'diners_club_international': function (cardNum) {
                    return /^3[0,6,8]\d{12}$/.test(cardNum);
                },
                'jcb': function (cardNum) {
                    return /^35(2[89]|[3-8][0-9])/.test(cardNum) && cardNum.length == 16;
                },
                'laser': function (cardNum) {
                    return /^(6304|670[69]|6771)/.test(cardNum) && (cardNum.length >= 16 && cardNum.length <= 19);
                },
                'visa_electron': function (cardNum) {
                    return /^(4026|417500|4508|4844|491(3|7))/.test(cardNum) && cardNum.length == 16;
                },
                'visa': function (cardNum) {
                    return /^4\d{15}$/.test(cardNum)
                },
                'mastercard': function (cardNum) {
                    return /^(5|2)[1-5]\d{14}$/.test(cardNum) || (cardNum !== null && cardNum.length == 16 &&
                        _isInMasterCardRanges(getBin(cardNum)));
                },
                'maestro': function (cardNum) {
                    return /^(5018|5020|5038|6304|6759|676[1-3])/.test(cardNum) && (cardNum.length >= 12 && cardNum.length <= 19);
                },
                'discover': function (cardNum) {
                    return /^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)/.test(cardNum) && cardNum.length == 16;
                },
                'aura': function (cardNum) {
                    return /^50/.test(cardNum) && (cardNum.length == 16 || cardNum.length == 19);
                },
                'sorocred': function (cardNum) {
                    return cardNum !== null &&
                        (cardNum.length == 16) &&
                        _sorocredBins.indexOf(getBin(cardNum)) > -1;
                },
                'outros': function (cardNum) {
                    return /[0-9]*/.test(cardNum) && (cardNum.length == 16 || cardNum.length == 19);
                }
            };

            for (var key in cardTypes) {
                if (cardTypes[key](number)) {
                    return key;
                    break;
                }
            }

            return 'desconhecido';
        };

        var RetornarBandeiraCartao1 = function (number) {
            var card_types = [
                {
                    name: 'amex',
                    pattern: /^3[47]/,
                    valid_length: [15],
                    codBandeira: 4
                }, {
                    name: 'hipercard',
                    pattern: /^(38|60)/,
                    valid_length: [13, 16, 19],
                    codBandeira: 6
                }, {
                    name: 'elo',
                    pattern: /^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/,
                    valid_length: [14, 16],
                    codBandeira: 7
                }, {
                    name: 'diners_club_carte_blanche',
                    pattern: /^30[0-5]/,
                    valid_length: [14],
                    codBandeira: 3
                }, {
                    name: 'diners_club_international',
                    pattern: /^36/,
                    valid_length: [14],
                    codBandeira: 3
                }, {
                    name: 'jcb',
                    pattern: /^35(2[89]|[3-8][0-9])/,
                    valid_length: [16],
                    codBandeira: 14
                }, {
                    name: 'laser',
                    pattern: /^(6304|670[69]|6771)/,
                    valid_length: [16, 17, 18, 19],
                    codBandeira: 15
                }, {
                    name: 'visa_electron',
                    pattern: /^(4026|417500|4508|4844|491(3|7))/,
                    valid_length: [16],
                    codBandeira: 18
                }, {
                    name: 'visa',
                    pattern: /^4/,
                    valid_length: [16],
                    codBandeira: 1
                }, {
                    name: 'mastercard',
                    pattern: /^5[1-5]/,
                    valid_length: [16],
                    codBandeira: 2
                }, {
                    name: 'maestro',
                    pattern: /^(5018|5020|5038|6304|6759|676[1-3])/,
                    valid_length: [12, 13, 14, 15, 16, 17, 18, 19],
                    codBandeira: 16
                }, {
                    name: 'discover',
                    pattern: /^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)/,
                    valid_length: [16],
                    codBandeira: 17
                }, {
                    name: 'aura',
                    pattern: /^50/,
                    valid_length: [16, 19],
                    codBandeira: 5
                }, {
                    name: 'maestro',
                    pattern: /^(5018|5020|5038|6304|6759|676[1-3])/,
                    valid_length: [12, 13, 14, 15, 16, 17, 18, 19],
                    codBandeira: 16
                }, {
                    name: 'sorocred',
                    pattern: /^(627892)/,
                    valid_length: [16],
                    codBandeira: 8
                }, {
                    name: 'outros',
                    pattern: /[0-9]*/,
                    valid_length: [16, 19],
                    codBandeira: 19
                }
            ];

            for (var i = 0; i < card_types.length; i++) {
                if (card_types[i].pattern.test(number)) {
                    return card_types[i];
                    break;
                }
            }

            return 'desconhecido';
        }

        var RetornarBandeiraCartao = function (number) {

            return cardType(number);
        }

        var GravarTrackersCompra = function (dadosCompraMO, retornoCompraMO) {
            if (retornoCompraMO.FormaDePagamento != "PagSeguro" && retornoCompraMO.FormaDePagamento != "MercadoPago") {
                // GARANTE QUE DATALAYER EXISTE
                if (typeof dataLayer == 'undefined' || dataLayer == null) { dataLayer = []; }

                // DYNAMIC X /////////////////////////////////////////////////////////////////

                try {
                    if (typeof google_tag_params == 'undefined' || google_tag_params == null) { google_tag_params = []; }
                    google_tag_params.push({
                        'travel_destid': '',
                        'travel_originid': '',
                        'travel_pagetype': 'conversion',
                        'travel_startdate': '',
                        'travel_enddate': '',
                        'travel_totalvalue': dadosCompraMO.ValorTotalPacote.toFixed('2')
                    });
                } catch (e) {
                }

                // CRITEO ////////////////////////////////////////////////////////////////////


                try {
                    var transactionProduct = [];
                    var itensCriteo = [];
                    var emailCriteo = [];

                    for (var i = 0; i < retornoCompraMO.GAEcommerce.TransactionProducts.length; i++) {
                        transactionProduct.push({
                            'sku': retornoCompraMO.GAEcommerce.TransactionProducts[i].SKU,
                            'name': retornoCompraMO.GAEcommerce.TransactionProducts[i].Name,
                            'category': retornoCompraMO.GAEcommerce.TransactionProducts[i].Category,
                            'price': retornoCompraMO.GAEcommerce.TransactionProducts[i].Price,
                            'quantity': retornoCompraMO.GAEcommerce.TransactionProducts[i].Quantity
                        });


                        itensCriteo.push({
                            'id': GlobalCheckout.dadosCheckout.Oferta.CodOferta, //retornoCompraMO.GAEcommerce.TransactionProducts[i].SKU,
                            'price': retornoCompraMO.GAEcommerce.TransactionProducts[i].Price,
                            'quantity': retornoCompraMO.GAEcommerce.TransactionProducts[i].Quantity
                        });

                    }

                    var transactionCriteo = {
                        id: retornoCompraMO.GAEcommerce.TransactionId,
                        item: itensCriteo
                    }

                    emailCriteo.push(md5(dadosCompraMO.Cliente.Email));

                    dataLayer.push({
                        'event': 'TransactionPage',
                        'setSiteType': (/iPad/.test(navigator.userAgent) ? "t" : (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile/.test(navigator.userAgent) ? "m" : "d")),
                        'setHashedEmail': emailCriteo,
                        'trackTransaction': transactionCriteo
                    });

                    var dadosGTMCheckout = {
                        gtm_offerId: dadosCompraMO.Opcoes[0].CodOfertaOpcao
                        , gtm_orderAmount: dadosCompraMO.DadosPagamento.ValorTotalAPagarComJuros // dadosCompraMO.Opcoes[0].ValorEntrada 
                        , gtm_orderId: retornoCompraMO.CodCompra
                    };

                    dataLayer.push({
                        'event': 'compra-checkout-success'
                        , 'gtm_orderAmount': dadosGTMCheckout.gtm_orderAmount
                        , 'gtm_orderId': dadosGTMCheckout.gtm_orderId
                        , 'gtm_offerId': dadosGTMCheckout.gtm_offerId
                    });
                }
                catch (ex) {
                }

                // RISE //////////////////////////////////////////////////////////////////////

                dataLayer.push({
                    'transactionId': retornoCompraMO.CodCompra,
                    'transactionTotal': dadosCompraMO.ValorTotalPacote.toFixed('2')
                });

                // GOOGLE GA /////////////////////////////////////////////////////////////////

                try {
                    var produtosGA = [];

                    if (dadosCompraMO.Opcoes.length > 0 && dadosCompraMO.Opcoes[0].CodOfertaOpcao > 0) {
                        for (var i = 0; i < dadosCompraMO.Opcoes.length; i++) {
                            produtosGA.push({
                                'name': GlobalCheckout.dadosCheckout.Oferta.TituloSecundario,
                                'id': GlobalCheckout.dadosCheckout.Oferta.CodOferta.toString(),
                                'price': dadosCompraMO.Opcoes[i].ValorTotal.toFixed('2'),
                                'brand': GlobalCheckout.dadosCheckout.Oferta.Fornecedor.Nome,
                                'category': GlobalCheckout.dadosCheckout.Oferta.Categoria.NomeCategoria,
                                'variant': dadosCompraMO.Opcoes[i].CodOfertaOpcao + '-' + dadosCompraMO.Opcoes[i].NomeOpcao,
                                'quantity': 1,
                                'coupon': ''
                            });
                        }
                    }
                    else if (dadosCompraMO.Cruzeiros.length > 0) {
                        produtosGA.push({
                            'name': GlobalCheckout.dadosCheckout.Oferta.TituloSecundario,
                            'id': GlobalCheckout.dadosCheckout.Oferta.CodOferta.toString(),
                            'price': dadosCompraMO.ValorTotalPacote.toFixed('2'),
                            'brand': GlobalCheckout.dadosCheckout.Oferta.Fornecedor.Nome,
                            'category': GlobalCheckout.dadosCheckout.Oferta.Categoria.NomeCategoria,
                            'variant': Globalize.format(dadosCompraMO.Cruzeiros[0].DataSaida, 'yyyy-MM-dd'),
                            'quantity': 1,
                            'coupon': ''
                        });
                    }
                    else {
                        produtosGA.push({
                            'name': GlobalCheckout.dadosCheckout.Oferta.TituloSecundario,
                            'id': GlobalCheckout.dadosCheckout.Oferta.CodOferta.toString(),
                            'price': dadosCompraMO.ValorTotalPacote.toFixed('2'),
                            'brand': GlobalCheckout.dadosCheckout.Oferta.Fornecedor.Nome,
                            'category': GlobalCheckout.dadosCheckout.Oferta.Categoria.NomeCategoria,
                            'variant': '',
                            'quantity': 1,
                            'coupon': ''
                        });
                    }

                    dataLayer.push({
                        'event': 'purchaseClick',
                        'gtm_orderAmount': dadosCompraMO.ValorTotalPacote.toFixed('2')
                        , 'gtm_orderId': dadosGTMCheckout.gtm_orderId
                        , 'gtm_offerId': dadosGTMCheckout.gtm_offerId,
                        'ecommerce': {
                            'purchase': {
                                'actionField': {
                                    'id': retornoCompraMO.CodCompra,
                                    'affiliation': 'Viajar Barato',
                                    'revenue': dadosCompraMO.ValorTotalPacote.toFixed('2'),
                                    'tax': '0',
                                    'shipping': '0',
                                    'coupon': ''
                                },
                                'products': produtosGA
                            }
                        },
                        'adwords_purchase_value': dadosCompraMO.ValorTotalPacote.toFixed('2'),
                        'adwords_purchase_currence': 'BRL',
                        'eventCallback': function () {
                            setTimeout(function () { RedirecionarPagamento(dadosCompraMO, retornoCompraMO) }, 1500);
                        }
                    });
                }
                catch (ex) {
                    RedirecionarPagamento(dadosCompraMO, retornoCompraMO);
                }

                // FACEBOOK //////////////////////////////////////////////////////////////////////

                try {

                    FacebookPurchase(
                        dadosCompraMO.Opcoes[i].ValorTotal.toFixed('2')
                        , "BRL"
                        , GlobalCheckout.dadosCheckout.Oferta.CodOferta
                    );
                }
                catch (ex) { }
            }
            else {
                RedirecionarPagamento(dadosCompraMO, retornoCompraMO);
            }
        }

        var RedirecionarPagamento = function (dadosCompraMO, retornoCompraMO) {
            // PAG SEGURO ////////////////////////////////////////////////////////////
            if (retornoCompraMO.FormaDePagamento == "PagSeguro" || retornoCompraMO.FormaDePagamento == "CobreBem") {
                window.location.href = retornoCompraMO.UrlRedirect;
            }

            // MERCADO PAGO //////////////////////////////////////////////////////////
            else if (retornoCompraMO.FormaDePagamento == "MercadoPago") {
                // CHAMA OS TRACKERS DE PARCEIROS

                try { eval(retornoCompraMO.UrlTrack); }
                catch (err) { }

                $('#mpifr').html('');
                $('<iframe />', {
                    name: 'pgtoMP',
                    id: 'pgtoMP',
                    width: '823',
                    height: '560',
                    frameborder: '0',
                    scrolling: 'no',
                    src: retornoCompraMO.UrlRedirect
                }).appendTo('#mpifr');
                evModal('#mp');

                EsconderLoading();
            }
            else {
                window.location.href = retornoCompraMO.UrlRedirect;
            }
        }

        var VerificarSituacaoPix = function (dadosCompraMO, retornoCompraMO) {

            this.GetStatus = function () {
                let idTransacao = retornoCompraMO.Codigo;

                CheckoutNovo.CheckStatus(idTransacao,
                    function (res) {
                        this.CallBack(res.value);
                    }.bind(this));

            };

            this.CallBack = function (res) {
                if (res.IsRunning && res.Expired == false) {
                    this.Continuar(res);
                }
                else {
                    if (res.Success)
                        this.Sucesso();
                    else
                        this.Falha(res);
                }
            };

            this.Sucesso = function () {
                //Redirecionar resultado
                //console.log("Função Sucesso!");
                GravarTrackersCompra(this.Compra, this.RetornoCompra);
            };

            this.Falha = function (res) {
                //console.log("Função Falha!");

                //debugger;

                this.OcultarDadosPix();

                if (res.Expired)
                    this.Expirou();
                else {
                    //console.log("Erro de Pagamento!");
                    alert("Ocorreu um erro durante a realização do pagamento.\nEscolha outra forma de pagamento e tente novamente.")
                }
            };

            this.Expirou = function () {
                //console.log("Expirado!");
                alert("Ocorreu um erro durante a realização do pagamento.\nClique novamente em Gerar PIX para realizar uma nova tentativa.")
            };

            this.Continuar = function () {
                //console.log("Continuar!");
                setTimeout(function () { this.GetStatus(); }.bind(this), 2000);
            };

            this.ExibirDadosPix = function () {

                if (!this.RetornoCompra || !this.RetornoCompra.Sucesso)
                    return;


                $('.aguardeLoading').hide();

                $("img.imgQr", ".instrucoesPagamentoPix").attr("src", this.RetornoCompra.QrCodeUrl);
                $("#hdQrCode", ".instrucoesPagamentoPix").val(this.RetornoCompra.QrCode);

                if ($(".instrucoesPagamentoPix").hasClass("oculto"))
                    $(".instrucoesPagamentoPix").removeClass("oculto");

            }

            this.OcultarDadosPix = function () {
                //Desabilitar Loading e habilitar o botao comprar
                /*  //O trecho abaixo foi movido para esconder loading
                if ($(".instrucoesPagamentoPix").hasClass("oculto") == false)
                    $(".instrucoesPagamentoPix").addClass("oculto");

                $("img.imgQr", ".instrucoesPagamentoPix").attr("src", "");
                $("#hdQrCode", ".instrucoesPagamentoPix").val("");

                $('#step1').show();

                $("#chkTermosECondicoes").prop("checked", false);
                $('.infoTermosCondicoes').show();
                */
                EsconderLoading();
            }

            this.Compra = dadosCompraMO;
            this.RetornoCompra = retornoCompraMO;

            this.ExibirDadosPix();

        }


        ////////////////////////
        // CODIGO PROMOCIONAL /
        //////////////////////

        $('#btnAplicarCodPromocional').click(function () {

            if ($('#txtCodPromocional').val().length <= 0) {

                alert('Digite o código de desconto');
                $('#txtCodPromocional').focus();
                $('#txtCodPromocional').css('border', '1px solid Red');

                return false;
            }

            CheckoutNovo.AplicarCodigoPromocional($('#txtCodPromocional').val(), function (res) {

                if (res.value.Sucesso) {

                    location.reload();

                } else {

                    alert('O desconto não foi aplicado.');
                    $('#txtCodPromocional').val('');
                    location.reload();
                }

            });



        });

        $('#txtCodPromocional').keypress(function () {

            $(this).css('border', '1px solid #ccc');

        });


        //#endregion MÉTODOS


        var PopularCheckout = function () {

            CheckoutNovo.DadosCheckout($('#hdnCodOferta').val(), function (res) {
                if (res.value != null) {
                    //VERIFICA SE POSSUI CRÉDITOS CASO O EMAIL JÁ VENHA PREENCHIDO DA SESSION/CACHE
                    var email = $('#txtEmail').val();
                    var origem = 22;

                    //if (!VerificarEmail(email)) {
                    //    $('#txtEmail').css('border', '1px solid #fc6500');
                    //    $('#txtEmail').focus();

                    //    SeloAutenticado('#autenticado', false);

                    //} else {
                    //    AutenticarEmail(email, origem);
                    //}

                    GlobalCheckout.dadosCheckout = res.value;
                    GlobalCheckout.loginMO = GlobalCheckout.dadosCheckout.Login;
                    // TRANSFORMA AS QUANTIDADES DE STRING PARA OBJETOS
                    if (GlobalCheckout.dadosCheckout.Oferta.QuantidadesOpcoesJson != null) {
                        try {
                            GlobalCheckout.dadosCheckout.Oferta.QuantidadesOpcoesJson = eval(GlobalCheckout.dadosCheckout.Oferta.QuantidadesOpcoesJson);
                        }
                        catch (ex) { }
                    }

                    Construtor();
                }
                else {
                    MostrarErroRedirect('Ocorreu um erro ao acessar a página de compra.', true);
                }
            });
        };

        if ($('#hdnEsgotado').val() == '0') {

            // PopularCheckout();
        }
        else {
            $('#loadingOpcoes').fadeOut().remove();
            $('.blocoMeiosPagamento').fadeIn()
        }
    });



});
