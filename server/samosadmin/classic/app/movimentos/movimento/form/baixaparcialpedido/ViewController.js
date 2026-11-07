Ext.define('SamosAdmin.movimentos.movimento.form.baixaparcialpedido.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentosbaixaparcialpedido',

    initViewModel: function(vm) {
        this.readOnly = true;
    },

    onAfterConstructor: async function(){
        const view = this.getView(),
              vm = this.getViewModel();

        this.calcularSaldorRestante();

        Ext.defer( ()=>{
            view.lookupReference('valorbaixa').focus();
        }, 100, this );

        //Se o valor do saldo restante for zero
        if( view.valorRestante <= 0 )
        {
            view.lookupReference('databaixa').setReadOnly(true);
            view.lookupReference('valorbaixa').setReadOnly(true);
            vm.set({
                bloquearGravacaoBaixa: true
            });
            view.query('button[text=Cancelar]')[0].setText('Sair');
        }
    },

    //Função chamada a todo momento que o usuario digita
    calcularSaldorRestante: function(valorNovo=0){
        const view = this.getView(), 
              valorTotalMovimento = view.valorTotalMovimento,
              vm   = this.getViewModel(),
              grid = Ext.$('formmovimentos')[0].lookupReference('financeiroscompra'),
              modelsGrid = grid.getStore().data.items,
              ultimaBaixa = modelsGrid[ modelsGrid.length-1 ] ? modelsGrid[ modelsGrid.length-1 ] : null;

        if(ultimaBaixa)
        {
            view.lookupReference('infoultimabaixa').setValue( moment(ultimaBaixa.data['CREDITOS_EMISSAO']).format('DD/MM/YYYY') );
        }

        //Percorre os models da store, somando o valor das baixas 
        let soma = 0;
        for( let i = 0 ; i < modelsGrid.length ; i++ )
        {
            soma += Number( modelsGrid[i].data['CREDITOS_VALOR'] );
        }

        const valorRestante = (valorTotalMovimento - soma - valorNovo);
        view.lookupReference('infosaldorestante').setValue( 'R$: ' + SamosUtils.Number.float2moeda( valorRestante, true ) );
        view.valorRestante = valorRestante;

        if(  Number( Number(view.valorRestante).toFixed(2) ) < 0 ){
            view.lookupReference('infosaldorestante').el.dom.querySelector('input').style.color = 'red';
        }else{
            view.lookupReference('infosaldorestante').el.dom.querySelector('input').style.color = 'black';
        }
    },

    onGravarClick: async function(){
        const view = this.getView(), 
              vm   = this.getViewModel(),
              viewForm = Ext.$('formmovimentos')[0],
              grid = viewForm.lookupReference('financeiroscompra'),
              modelsGrid = grid.getStore().data.items,
              databaixa = view.lookupReference('databaixa').getValue(),
              valorbaixa = view.lookupReference('valorbaixa').getValue(),
              modelForm = viewForm.model,
              valorRestante = view.valorRestante,
              valorTotalMovimento = view.valorTotalMovimento;

        //Dados pra criar o CREDITOS_NOME
        const numeroForm = modelForm.get('MOVIMENTOS_NUMERO'),
              serieForm  = modelForm.get('MOVIMENTOS_SERIE'),
              nomePessoa = modelForm.get('PESSOAS_NOME') || viewForm.lookupReference('pessoa').getValue();

        if(!databaixa){
            Ext.Note('warning', 'Preencha a data da baixa!');

            Ext.defer( ()=>{
                view.lookupReference('databaixa').focus();
            }, 50, this );
            return;
        }

        if(Number(valorbaixa) == 0){
            Ext.Note('warning', 'Preencha o valor da baixa!');

            Ext.defer( ()=>{
                view.lookupReference('valorbaixa').focus();
            }, 50, this );
            return;
        }

        if( Number( Number(valorRestante).toFixed(2) ) < 0 ){
            Ext.Note('warning', 'O valor da baixa excede o valor total do movimento!.');
            return;
        }

        //Novo model
        const novoModel = new SamosAdmin.movimentos.movimento.ModelBaixa();

        novoModel.set({
            'CREDITOS_ID_MOVIMENTOS'  : modelForm.get('MOVIMENTOS_ID'),
            'CREDITOS_ID_PESSOAS'     : modelForm.get('MOVIMENTOS_ID_PESSOAS'),
            'CREDITOS_NOME'           : `${numeroForm} ${serieForm} - ${nomePessoa}`,
            'CREDITOS_TIPO'           : 'B',
            'CREDITOS_EMISSAO'        : moment(databaixa).format('YYYY-MM-DD'),
            'CREDITOS_VALOR'          : valorbaixa
        });

        //Grava a nova baixa na tabela CREDITOS
        const queryInsercaoBaixa = await SamosUtils.Request.nodeApi({
            url: `/processos/executasql`,
            method: 'GET',
            query: {
                nomeSql: 'adicionar_baixa',
                parametroSql: JSON.stringify({
                    model: novoModel.data
                })   
            }
        });

        //Atualiza a grid
        modelForm.set({
            'BAIXASPARCIAIS_MOVIMENTO': queryInsercaoBaixa.results
        });
        
        grid.getStore().reload();

        //Atualiza o saldo restante da pruden aço no form
        viewForm.initGauge('Calculando Saldo Restante ...');
        Ext.defer( ()=>{
            viewForm.lookupReference('subst').setValue(  Number( Number(valorRestante).toFixed(2) ) );
            viewForm.stopGauge();
        }, 180, this );

        this.onSairClick();
    }
});
