import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('🔍 Verificando reflexo no Dashboard dos Contratos 15 e 17...');
  await supabase.auth.signInWithPassword({
    email: 'admin@sempi.com',
    password: 'Admin@Sempi2026!',
  });

  const { data: alteracoes } = await supabase.from('alteracoes_contratuais').select('*');
  const { data: contratos } = await supabase.from('contratos').select('*');

  for (const c of contratos.filter(x => x.numero_contrato && (x.numero_contrato.includes('015') || x.numero_contrato.includes('017')))) {
    const alts = alteracoes.filter(a => a.contrato_id === c.id);
    const isContinuo = c.tipo_contrato === 'CONTINUO';
    const valorInicialNum = Number(c.valor_inicial) || 0;

    const acrescimoQueConsomeTetoTotal = alts.reduce((acc, alt) => {
      const valorDif = Number(alt.valor_diferenca) || 0;
      if (isContinuo) {
        if (alt.tipo === 'ADITIVO_PRAZO') return acc;
        if (alt.tipo === 'ADITIVO_MISTO') return acc + Math.max(0, valorDif - valorInicialNum);
        if (alt.tipo === 'ADITIVO_VALOR') return acc + valorDif;
        return acc;
      } else {
        if (alt.tipo === 'ADITIVO_VALOR' || alt.tipo === 'ADITIVO_MISTO') return acc + valorDif;
        return acc;
      }
    }, 0);

    const percentualAcrescimoReal = valorInicialNum > 0
      ? (acrescimoQueConsomeTetoTotal / valorInicialNum) * 100
      : 0;

    console.log(`\n📋 Contrato: ${c.numero_contrato} (${c.tipo_contrato})`);
    console.log(`   • Valor Base:      R$ ${valorInicialNum.toLocaleString('pt-BR')}`);
    console.log(`   • Valor Global:    R$ ${Number(c.valor_atualizado).toLocaleString('pt-BR')}`);
    console.log(`   • Qtd Aditivos:    ${alts.length} termo(s) [${alts.map(a => a.tipo).join(', ')}]`);
    console.log(`   • Acréscimo Art 125: R$ ${acrescimoQueConsomeTetoTotal.toLocaleString('pt-BR')} (${percentualAcrescimoReal.toFixed(2)}%)`);
    console.log(`   • Status no Teto:  ${percentualAcrescimoReal > 25 ? '⚠️ ESTOURADO' : '✅ REGULAR (<= 25%)'}`);
  }
}

test().catch(console.error);
