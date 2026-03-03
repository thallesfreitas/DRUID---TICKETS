/**
 * PrivacyView Component
 * Privacy policy page
 */

import { LegalView } from './LegalView';

interface PrivacyViewProps {
  onBack: () => void;
}

export function PrivacyView({ onBack }: PrivacyViewProps) {
  const privacyContent = (
    <>
      <p>
        A ZAMP S.A. (“ZAMP”) é master franqueada e operadora, no Brasil, dos
        restaurantes BURGER KING®. A ZAMP atualmente adota valores baseados em{' '}
        meritocracia, foco no cliente, visão de dono, alegria, ética e
        simplicidade.
      </p>

      <p>
        Visando o foco no cliente e a preservação de valores éticos, a ZAMP
        acredita também que a proteção de dados pessoais e a privacidade das
        pessoas são imprescindíveis para construção de um bom relacionamento com
        seus consumidores, franqueados, fornecedores, parceiros e prestadores
        de serviços, uma vez que a ZAMP acaba por gerenciar informações
        pessoais para, principalmente, aprimorar produtos e serviços com a
        finalidade de melhorar cada vez mais a experiência de todos que
        interagem com o ZAMP.
      </p>

      <p>
        As diretrizes fixadas neste documento (“Diretrizes de Privacidade”)
        aplicam-se a todo tratamento conduzido pela ZAMP em território nacional
        com relação a dados pessoais que esta venha a coletar de clientes,
        investidores, fornecedores, prestadores de serviço, parceiros,
        potenciais franqueados, franqueados, candidatos em processos seletivos
        para vagas de trabalho e demais terceiros com quem a ZAMP venha a se
        relacionar (“Titular(es)”).
      </p>

      <p>
        A leitura do presente documento é indispensável para os Titulares que
        possuam interesse em interagir com sites ou aplicações digitais da ZAMP
        e das marcas por ela operadas (“Plataformas de Interação”). O Titular
        que não estiver integralmente de acordo com os termos aqui previstos
        deve se abster de acessar as Plataformas de Interação de compartilhar
        dados pessoais por meio delas.
      </p>

      <p>
        Como condição para acesso e uso das Plataformas de Interação da ZAMP, o
        Titular declara ser maior de 18 (dezoito) anos e que fez leitura
        completa e atenta das regras deste documento, ou, quando menor de
        idade, que está devidamente representado ou assistido por seus pais ou
        representantes legais.
      </p>

      <p>
        Caso não esteja de acordo com as condições previstas nestas Diretrizes
        de Privacidade, o Titular deve descontinuar, imediatamente, o acesso ou
        uso das Plataformas de Interação da ZAMP.
      </p>

      <h3><b>DEFINIÇÕES</b></h3>
      <p>
        A leitura deste documento deve levar em consideração as seguintes
        definições e significados:
      </p>

      <h4><b>Cookies</b></h4>
      <p>
        Pequenos arquivos enviados pelos sistemas das Plataformas de Interação
        da ZAMP, salvos nos dispositivos dos Titulares, que armazenam as
        preferências e outras informações, com a finalidade de personalizar a
        navegação dos Titulares, de acordo com os seus respectivos perfis.
      </p>

      <h4><b>Dado Pessoal</b></h4>
      <p>
        Quaisquer dados pessoais de qualquer pessoa física que possua
        relacionamento com a ZAMP. Exemplo: Nome, Endereço, RG, CPF, filiação e
        data de nascimento.
      </p>

      <h4><b>Dado Pessoal Sensível</b></h4>
      <p>
        Dado pessoal sobre origem racial ou étnica, convicção religiosa,
        opinião política, filiação a sindicato ou a organização de caráter
        religioso, filosófico ou político, dado referente à saúde ou à vida
        sexual, dado genético ou biométrico, quando vinculado a uma pessoa
        natural.
      </p>

      <h4><b>Encarregado/DPO (Data Protection Officer)</b></h4>
      <p>
        Pessoa indicada pelo controlador e operador para atuar como canal de
        comunicação entre o controlador, os Titulares dos dados e a Autoridade
        Nacional de Proteção de Dados (ANPD).
      </p>

      <h4><b>IP</b></h4>
      <p>
        (Abreviatura de Internet Protocol): Conjunto de números que identificam
        os computadores, smartphones e demais dispositivos aptos a acessarem a
        internet.
      </p>

      <h4><b>Lei Geral de Proteção de Dados Pessoais (LGPD)</b></h4>
      <p>
        A Lei nº 13.709/2018 ou LGPD, que dispõe sobre o tratamento de dados
        pessoais de pessoas naturais, independente do meio, por pessoa natural
        ou por pessoa jurídica de direito público ou privado, com o objetivo de
        proteger os direitos fundamentais de liberdade e de privacidade e o
        livre desenvolvimento da personalidade da pessoa natural.
      </p>

      <h4><b>Transferência Internacional de Dados</b></h4>
      <p>
        Transferência de dados pessoais para país estrangeiro ou organismo
        internacional do qual o país seja membro.
      </p>

      <h4><b>Tratamento</b></h4>
      <p>
        Toda e qualquer operação realizada pela ZAMP com dados pessoais, como
        as que se referem a coleta, produção, recepção, classificação,
        utilização, acesso, reprodução, transmissão, distribuição,
        processamento, arquivamento, armazenamento, eliminação, avaliação ou
        controle da informação, modificação, comunicação, transferência,
        difusão ou extração.
      </p>

      <h3> <b>DADOS E INFORMAÇÕES COLETADOS PELA ZAMP E SUAS RESPECTIVAS FINALIDADES</b></h3>
      <h4><b>Dados coletados pela ZAMP</b></h4>
      <p>
        Para que a ZAMP desempenhe suas atividades, torna-se imprescindível a
        coleta de algumas informações sobre o Titular. Desta forma, poderão ser
        coletados, por telefone, e-mail, em nosso site, nas aplicações
        disponibilizadas pela ZAMP ou por suas marcas, bem como durante a
        prestação dos serviços realizados pelas franqueadas, dados pessoais
        fornecidos diretamente pelo Titular, por terceiros ou coletados de
        forma automática, de acordo com o serviço contratado ou tipo de
        relacionamento do Titular com a ZAMP. Veja abaixo as formas de coleta
        de dados pessoais:
      </p>

      <p>
        Informações cadastrais: Nome completo, RG, CPF, data de nascimento,
        endereço, CEP, telefone, e-mail, logs de acesso (registro de
        atividades), token ao utilizar aplicativos da ZAMP, informações sobre
        cliques em ambientes virtuais (inclusive coletadas por meio de cookies),
        endereço de IP, dados transacionais para compras (ex.: informações de
        cartões de crédito e débito), geolocalização, páginas visitadas, anúncios
        visualizados, preferências de compras, tipo de navegador, data e
        horários de acesso.
      </p>

      <p>
        Informações públicas: Informações sobre Titulares que estejam
        disponíveis publicamente na internet, informações sobre menções ou
        interações feitas com a marca BURGER KING®.
      </p>

      <p>
        Além dos dados mencionados nesse item, a ZAMP também poderá tratar
        informações pessoais sempre que houver permissão ou exigência pela
        legislação aplicável, inclusive sem a necessidade de consentimento dos
        Titulares. Nesses casos, a coleta poderá ocorrer, entre outras
        hipóteses, quando necessária para: (i) celebração ou execução de
        contratos em que o Titular seja ou venha a ser uma das partes; (ii)
        cumprimento de obrigações legais às quais a ZAMP esteja sujeita; e
        (iii) atendimento a interesses legítimos da ZAMP, sempre observados os
        direitos e garantias do Titular.
      </p>

      <p>
        Além disso, a ZAMP poderá monitorar o uso de equipamentos, instalações,
        dispositivos, computadores, rede, aplicativos, softwares e demais ativos
        ou recursos corporativos, o que pode resultar na coleta de informações
        pessoais. Esse monitoramento também pode incluir o uso de câmeras de
        circuito interno (CFTV) em ou ao redor das instalações da ZAMP.
      </p>
    </>
  );

  return (
    <LegalView
      title="DIRETRIZES DE PRIVACIDADE DE DADOS
SOBRE A ZAMP E SUAS DIRETRIZES DE PRIVACIDADE DE DADOS"
      content={privacyContent}
      onBack={onBack}
    />
  );
}