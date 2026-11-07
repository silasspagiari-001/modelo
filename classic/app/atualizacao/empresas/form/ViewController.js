Ext.define('SamosAdmin.atualizacao.empresas.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formempresas',

/*    init() {
        SamosWidgets.ChatSocket.on(
            'testeresposta',
            console.log(dados)
        );
    },*/

    //se apagar o CEP, sao sair do campo, ele limpar os dados do endereço automaticamente
    onSairCampoCep: function(campo, evento){
        const vm = this.getViewModel(),
              model = vm.get('model'),
              cepBuscando = campo.getRawValue().replace(/\D/ig, '');

        if( !vm.get('readOnly') && cepBuscando == '' ){
            //Limpa os campos pra evitar confusao
            model.set({
                'EMPRESAS_ID_CIDADES' : '',
                'CIDADES_NOME'        : '',
                'CIDADES_ESTADO'      : '',
                'CIDADES_IBGE'        : '',
                'EMPRESAS_ENDERECO'   : '',
                'EMPRESAS_BAIRRO'     : ''
            });
        }
    },

    validarPortador: function(txt, portador){
        Portador.services.Model.validar(txt, portador, this.getViewModel());
    },

    validarCabecalho: async function() {
        await this.validarRegiao12();
        return this.callParent(arguments);
    },

    validarRegiao12: function() {
        try {
            const model = this.getRecord();
            const ufs = Object.keys(SamosUtils.Info.getEstados());            

            let empresaRegiao = model.get('EMPRESAS_REGIAO12') || '';

            //muda o coringa split de "#" para ","
            empresaRegiao = empresaRegiao.replace(/#/ig, ',');

            //tira a última vírgula se houver
            empresaRegiao = empresaRegiao.replace(/,$/, '');

            model.set('EMPRESAS_REGIAO12', empresaRegiao);

            const ufsInvalidas = empresaRegiao.split(',').filter(uf => ufs.indexOf(uf) == -1);

            if(ufsInvalidas.length > 0) {
                this.lookup('empresaregiao').focus(true);
                throw `UF(s) inválida(s): ${ufsInvalidas}`;
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao validar');
            throw error;
        }
    },

    onGravacaoSucesso: async function (record) { 
        this.callParent(arguments);

        await SamosUtils.Utils.sleep(500);

        if(record.get('EMPRESAS_ID') == configs.getEmpresa().id) {
            if(await SamosUtils.Msg.confirm('A empresa logada sofreu alterações. Recarregar o sistema?')) {
                window.location.reload();
            }
        }
    },

    onImprimirClick: async function () {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/fichaempresa`,
                    method: 'GET',
                    query: {
                        conteudo   : this.getViewModel().get('model.EMPRESAS_ID'),
                        empresacnpj: configs.getEmpresa().cnpj,
                        ordem      : 4,
                        status     : 2
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    onSefazClick: async function(btn, evento){
        const view = this.getView(),
              model = this.getRecord(),
              campoCpfCnpj = view.lookupReference('cnpj')

        /*SE FOR CPF OU CNPJ, DEFINE O CAMPO CATEGORIA */
        const cpfCnpj = model.get('EMPRESAS_CPFCNPJ');

        if( campoCpfCnpj.getRawValue().length == 11 ){
            if( !SamosUtils.String.isCpf( campoCpfCnpj.getRawValue() ) ){
                campoCpfCnpj.focus();
                return;
            }
        } else {
            if( !SamosUtils.String.isCnpj( campoCpfCnpj.getRawValue() ) ){
                campoCpfCnpj.focus();
                return;
            }
        }
        
        if(await SamosUtils.Msg.confirm('Deseja carregar os dados da SEFAZ ?')){
            try {
                //this.getView().initGauge('Buscando dados...');
                this.onConsultarCpfAPI(btn, evento);
               
            } catch (error) {
                SamosUtils.Msg.alert('CNPJ não encontrado na Sefaz');
            }
        
        }
    },

    onConsultarCpfAPI: async function(btn, evento){
        const view = this.getView(),
              vm = this.getViewModel(),
              model = vm.get('model'),
              campo             = view.lookupReference('cnpj');
              campoNome         = view.lookupReference('nome'),
              campoCategoria    = view.lookupReference('categoria');

        if( campo.getValue().trim() == '' ){
            Ext.Note(
                'warning', 
                `CPF/CNPJ não foi informado!<br><br>
                `, 1000);   
            return;
        }

        //Se nao tiver nem o minimo de caracteres de um CPF OU CNPJ, ELE DIZ PRA TERMINAR DE DIGITAR
        if( campo.getValue().trim().length < 11 ){
            Ext.Note(
                'warning', 
                `CPF/CNPJ invalido!<br><br>
                `, 1000);  
            return;
        }
        
        if( campo.getValue().length == 11 ){
        }else{
            view.initGauge('Consultando SEFAZ...');

            const url = new URL(`https://api.cnpja.com/office/${ SamosUtils.String.onlyNumbers(campo.getValue().trim()) }?registrations=BR`);
            const consulta = await fetch(url, {
                method: 'GET',
                headers: {
                   'Content-Type': 'application/json',
                   'Authorization': '393ca38d-9a7b-48c1-9cc2-80f85ca7a5c3-7d08b990-6efb-46c7-bf13-597f44a43983'
                }
            });
            const resultadoConsulta = (await consulta.json());

            if(resultadoConsulta['status'])
            {
                if( resultadoConsulta['status']['text'] != 'Ativa'){
                    view.stopGauge();
                    SamosUtils.Msg.alert(`ERRO. Empresa com status SEFAZ: ${ resultadoConsulta['status']['text'] } `);
                    
                    campo.setValue('');
                    Ext.defer( ()=>{
                        campo.focus();
                    }, 100, this );

                    return;
                }
            }

            if( (resultadoConsulta['registrations'] || []).length == 0 ){
                campoCategoria.setValue('1');
            }

            if(resultadoConsulta['registrations'])
            {
                if(resultadoConsulta['registrations'].length > 0){
                    if( resultadoConsulta['registrations'].length == 1  ){
                        model.set({
                            'EMPRESAS_INSCRICAO' : resultadoConsulta['registrations'].length > 0 ? resultadoConsulta['registrations'][0]['number'] : ''
                        })
                    } else {
                        const inscricaoEstado = resultadoConsulta['registrations'].filter( (inscricao)=>{ if(inscricao['state'] == resultadoConsulta['address']['state'] && inscricao['enabled'] == true){ return inscricao } } );
                        const indexUltimo = inscricaoEstado.length-1;
                        model.set({
                            'EMPRESAS_INSCRICAO' : inscricaoEstado[indexUltimo] ? inscricaoEstado[indexUltimo]['number'] : ''
                        })
                    }
                } else {
                    model.set({
                        'EMPRESAS_INSCRICAO'   : ''
                    }) 
                }

                function getInscricoesValidaEmMeioInvalidas(inscricoes)
                {
                    let incricoesValidas = [];
                    for( let i = 0 ; i < inscricoes.length ; i++ )
                    {
                        if( inscricoes[i]['enabled'] == true )
                        {
                            incricoesValidas.push( inscricoes[i] );
                        }
                    }
                    return incricoesValidas;
                }

                function getInscricoesEstado(inscricoes, estadoParam)
                {
                    let incricoesEstado = [];
                    for( let i = 0 ; i < inscricoes.length ; i++ )
                    {
                        if( inscricoes[i]['state'] == estadoParam )
                        {
                            incricoesEstado.push( inscricoes[i] );
                        }
                    }
                    return incricoesEstado;
                }

                let todasInscricoesValidas = getInscricoesValidaEmMeioInvalidas( resultadoConsulta['registrations'] );
                let todasInscricoesValidasEstado = getInscricoesEstado( todasInscricoesValidas, resultadoConsulta['address']['state'] );
                let isInscricaoValida = true;

                if( todasInscricoesValidasEstado.length > 0 || 
                    (resultadoConsulta['registrations'] || []).length == 0 || 
                    resultadoConsulta['address']['state'] == 'BA' ||
                    String(resultadoConsulta['company']['name'] || '').match(/ASSOC/)
                    ){
                    //Esta valida
                    isInscricaoValida = true;
                } else {
                    isInscricaoValida = false;
                }

                if( isInscricaoValida == false ){
                    view.stopGauge();

                    if(configs.getPessoas().permiteIEBaixada) {
                        Ext.Msg.confirm('Confirmação', 'Empresa com IE Baixada/Inválida - continuar', btn => {
                            if (btn == 'yes') {
                                model.set({ 'EMPRESAS_INSCRICAO'   : '' })         
                            } else {
                                campo.setValue('');
                                Ext.defer( ()=>{
                                    campo.focus();
                                }, 100, this );

                                model.set({'EMPRESAS_INSCRICAO' : ''})
                                return;
                            }
                        });
                    } else {
                        SamosUtils.Msg.alert(`ERRO. Empresa com inscrição inválida! `);
                        campo.setValue('');
                        Ext.defer( ()=>{
                            campo.focus();
                        }, 100, this );
    
                        return;    
                    }
                }

                model.set({
                    'EMPRESAS_NOME'      : String(resultadoConsulta['company']['name'] || '').slice(0,50),
                    'EMPRESAS_FANTASIA'  : String(resultadoConsulta['alias'] || '').slice(0,50),
                    'EMPRESAS_CEP'       : SamosUtils.String.onlyNumbers( resultadoConsulta['address']['zip'] ),
                    'CIDADES_NOME'       : resultadoConsulta['address']['city'],
                    'CIDADES_ESTADO'     : resultadoConsulta['address']['state'],
                    'EMPRESAS_EMAIL'     : resultadoConsulta['emails'].length > 0 ? resultadoConsulta['emails'][0]['address'] : '',
                    'EMPRESAS_ENDERECO'  : String(resultadoConsulta['address']['street'] || '').slice(0,50),
                    'EMPRESAS_NUMERO'    : resultadoConsulta['address']['number'],
                    'EMPRESAS_BAIRRO'    : String(resultadoConsulta['address']['district'] || '').slice(0,50),
                    'EMPRESAS_CELULAR'   : resultadoConsulta['phones'][0] ? resultadoConsulta['phones'][0]['area'] + resultadoConsulta['phones'][0]['number'] : '',
                    'EMPRESAS_PAGINA'    : resultadoConsulta['address']['details'] || ''
                }) 

                const consultaIdCidade = (await SamosUtils.Request.nodeApi({
                    url: '/consultas/ceps',
                    method: 'GET',
                    data: {
                        conteudo: model.get('EMPRESAS_CEP'),
                        ordem: 0,
                        start: 0,
                        limit: 1
                    }
                })).results;

                if( consultaIdCidade.length > 0 )
                {
                    const idCidade = consultaIdCidade[0]['CEPS_ID'];
                    model.set({
                        'EMPRESAS_ID_CIDADES': idCidade
                    });

                    view.lookup('cep').setSearchedId( model.get('EMPRESAS_CEP') );
                }

                view.lookupReference('cidade').setValue( resultadoConsulta['address']['city'] );
                view.lookupReference('estado').setValue( resultadoConsulta['address']['state'] );
            }
            
            view.stopGauge();
        }
    }

});