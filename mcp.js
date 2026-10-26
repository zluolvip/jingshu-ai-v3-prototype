/* MCP 能力由官方统一发布；企业只查看和使用。静态原型不提供真实 MCP 服务。 */
const MCP_CATALOG=[
  {id:'inventory.search',name:'库存明细查询',domain:'库存',tool:'库存查询',description:'按店铺查询可用库存，保留 ASIN 与卖家 SKU 明细。',params:'店铺、ASIN / SKU',fields:'店铺、ASIN、卖家 SKU、可用库存、数据来源、同步时间'},
  {id:'orders.summary',name:'订单销量汇总',domain:'订单',tool:'订单查询',description:'按店铺和时间窗口汇总销量，辅助判断销售趋势。',params:'店铺、时间范围',fields:'店铺、ASIN、销量、统计区间、数据来源、同步时间'},
  {id:'inbound.list',name:'在途明细查询',domain:'在途',tool:'在途查询',description:'查询在途数量与预计到仓时间，缺失项明确标记。',params:'店铺、卖家 SKU',fields:'店铺、卖家 SKU、在途数量、预计到仓、数据来源、同步时间'},
  {id:'products.search',name:'产品资料查询',domain:'产品资料',description:'按产品编码检索产品主档与基础属性。',params:'店铺、产品编码',fields:'产品编码、基础属性、数据来源、同步时间'},
  {id:'listing.search',name:'Listing 查询',domain:'Listing',description:'检索店铺 Listing 的刊登信息。',params:'店铺、ASIN',fields:'店铺、ASIN、刊登状态、数据来源、同步时间'},
  {id:'purchase.list',name:'采购记录查询',domain:'采购',description:'按店铺或产品查询采购记录。',params:'店铺、产品编码',fields:'店铺、产品编码、采购数量、数据来源、同步时间'}
];
const MCP_SERVER_URL='https://mcp.example.com/mcp'; // 原型占位地址，上线后替换为真实官方端点。
function mcpConnectionText(){return JSON.stringify({name:'境枢业务数据 MCP',transport:'streamable-http',url:MCP_SERVER_URL,authentication:'OAuth 2.1（连接时登录）'},null,2)}
function mcpHydrate(){
  // 与旧版卖家自配置发布数据分开，避免升级后误把旧授权当作官方发布。
  data.mcpOfficial??={versions:Object.fromEntries(MCP_CATALOG.map((cap,index)=>[cap.id,{published:index<3,version:'v1.0'}]))};
  data.mcpOfficial.versions??={};
  for(const [index,cap] of MCP_CATALOG.entries())data.mcpOfficial.versions[cap.id]??={published:index<3,version:'v1.0'};
}
function mcpCapability(id){return MCP_CATALOG.find(cap=>cap.id===id)}
function mcpRelease(cap){return data.mcpOfficial.versions[cap.id]}
function mcpReadiness(cap,store){
  if(!mcpRelease(cap).published)return {ok:false,reason:'官方尚未发布'};
  const source=sourceForStore(store,cap.domain);
  if(!source)return {ok:false,reason:'当前店铺没有可用的数据来源'};
  if(source.status!=='成功')return {ok:false,reason:`${cap.domain}同步${source.status} · ${source.last||'暂无时间'}`};
  return {ok:true,reason:'可使用',source};
}
function mcpPage(){
  mcpHydrate();
  const published=MCP_CATALOG.filter(cap=>mcpRelease(cap).published);
  const usable=published.filter(cap=>authorizedStores().some(store=>mcpReadiness(cap,store).ok));
  return `${heading(route==='mcp-official'?'官方 MCP 发布':'MCP 中心',route==='mcp-official'?'官方按业务域统一封装和发布标准数据能力。':'复制官方 MCP 连接信息，在支持远程 MCP 的 Agent 客户端中添加服务。')}
  <section class="card mcp-hero"><div><div class="eyebrow">OFFICIAL MCP / 平台统一发布</div><h2>一个连接，获取已发布的数据工具</h2><p>境枢 AI 官方维护服务地址、工具定义与版本。企业连接后完成身份授权，Agent 才能在员工与店铺权限范围内使用工具。</p><div class="mcp-hero-flow"><span>复制连接信息</span><b>→</b><span>客户端添加 MCP</span><b>→</b><span>企业授权登录</span><b>→</b><span>Agent 发现工具</span></div></div><div class="mcp-endpoint"><small>${route==='mcp-official'?'官方发布目录':'当前企业 · 远航贸易'}</small><strong>${route==='mcp-official'?`${published.length} / ${MCP_CATALOG.length} 项已发布`:`${usable.length} / ${published.length} 项数据就绪`}</strong><span>${route==='mcp-official'?'发布状态由官方统一维护':'连接成功后仍按数据权限校验每次调用'}</span></div></section>
  ${route==='mcp-official'?mcpOfficialPage():mcpSellerPage()}
  <div class="notice blue mcp-boundary"><b>ⓘ</b><span>本页为本地交互原型。连接地址是 example.com 占位示例，不存在真实 MCP 服务；正式地址与授权登录将在平台上线后提供。</span></div>`;
}
function mcpSellerPage(){
  const available=MCP_CATALOG.filter(cap=>mcpRelease(cap).published);
  return `<section class="card mcp-connect-card" aria-label="MCP 连接信息"><div class="mcp-connect-head"><div><div class="eyebrow">CONNECTION / 官方服务</div><h2>境枢业务数据 MCP</h2><p>把此服务接入支持 Streamable HTTP 的 Agent 客户端，客户端会发现下方已发布工具。</p></div>${status('官方发布')}</div><div class="mcp-connect-grid"><div><small>服务地址 · 演示占位</small><code>${esc(MCP_SERVER_URL)}</code></div><div><small>传输方式</small><strong>Streamable HTTP</strong></div><div><small>身份认证</small><strong>OAuth 2.1 · 连接时登录</strong></div></div><div class="inline-actions">${btn('复制 MCP 配置信息','mcp-copy','config','small')}${btn('仅复制连接地址','mcp-copy','url','secondary small')}</div><p class="mcp-connect-hint">不同客户端的配置文件格式可能不同。复制地址后在客户端添加远程 MCP 服务并完成登录；本示例没有可用令牌或真实接口。</p><details class="mcp-config-preview"><summary>查看配置内容示例</summary><pre>${esc(mcpConnectionText())}</pre></details></section>
  <div class="mcp-section-head"><div><h2>此连接提供的工具</h2><p>工具由官方发布；企业只能查看说明，无法改写能力定义或发布范围。</p></div></div>
  <div class="mcp-catalog-grid">${available.map(cap=>{const readyStores=authorizedStores().filter(store=>mcpReadiness(cap,store).ok);return `<article class="card mcp-capability"><div class="mcp-card-top"><span class="mcp-domain">${esc(cap.domain)} · 官方工具</span>${status(readyStores.length?'数据就绪':'数据待就绪')}</div><h3>${esc(cap.name)}</h3><code>${esc(cap.id)} · ${esc(mcpRelease(cap).version)}</code><p>${esc(cap.description)}</p><div class="mcp-cap-meta"><span>输入：${esc(cap.params)}</span><span>数据就绪店铺：${readyStores.length} 个</span></div><div class="inline-actions">${btn('查看工具说明','mcp-detail',cap.id,'secondary small')}</div></article>`}).join('')||'<div class="card mcp-empty"><h3>暂无已发布工具</h3><p>请等待官方发布。</p></div>'}</div>`;
}
function mcpOfficialPage(){
  const published=MCP_CATALOG.filter(cap=>mcpRelease(cap).published).length;
  return `<div class="mcp-section-head"><div><h2>业务域能力发布</h2><p>仅供官方管理视角演示。卖家页面不提供能力定义、字段和发布开关。</p></div>${status(`${published} 项已发布`)}</div>
  <div class="mcp-catalog-grid">${MCP_CATALOG.map(cap=>{const release=mcpRelease(cap);return `<article class="card mcp-capability"><div class="mcp-card-top"><span class="mcp-domain">${esc(cap.domain)} · 官方</span>${status(release.published?'已发布':'未发布')}</div><h3>${esc(cap.name)}</h3><code>${esc(cap.id)} · ${esc(release.version)}</code><p>${esc(cap.description)}</p><div class="mcp-cap-meta"><span>输入：${esc(cap.params)}</span><span>输出：${esc(cap.fields)}</span></div><div class="inline-actions">${btn(release.published?'暂停发布':'发布能力',release.published?'mcp-pause':'mcp-publish',cap.id,release.published?'danger small':'small')}${btn('查看契约','mcp-detail',cap.id,'secondary small')}</div></article>`}).join('')}</div>
  <div class="notice blue mcp-seller-note"><b>ⓘ</b><span>发布状态面向所有企业生效；实际查询仍由服务端按企业、员工、店铺和 ERP 授权限制。此原型只展示官方发布结果。</span></div>`;
}
function mcpModal(type,id){
  const cap=mcpCapability(id);
  if(type==='mcp-detail'&&cap)return modalBox(esc(cap.name),`<div class="detail-rows">${row('发布方','境枢 AI 官方')}${row('业务域',esc(cap.domain))}${row('工具标识',`<code>${esc(cap.id)}</code>`)}${row('输入参数',esc(cap.params))}${row('返回字段',esc(cap.fields))}${row('版本',esc(mcpRelease(cap).version))}${row('状态',status(mcpRelease(cap).published?'已发布':'未发布'))}</div><div class="notice blue" style="margin-top:16px"><b>ⓘ</b><span>此工具随官方 MCP 服务发布。Agent 连接服务后可发现工具，实际调用仍需企业登录和数据权限。</span></div>`);
  return '';
}
async function mcpCopy(value){
  const content=value==='url'?MCP_SERVER_URL:mcpConnectionText();
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(content)}else throw new Error('clipboard unavailable')}
  catch{const input=document.createElement('textarea');input.value=content;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();const copied=document.execCommand('copy');input.remove();if(!copied){toast('复制失败，请手动复制页面中的连接信息');return}}
  toast(value==='url'?'连接地址示例已复制':'MCP 配置信息示例已复制');
}
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-action^="mcp-"]');if(!target)return;
  event.preventDefault();event.stopImmediatePropagation();
  const action=target.dataset.action,id=target.dataset.id;
  if(action==='mcp-copy'){mcpCopy(id);return}
  if(action==='mcp-pause'||action==='mcp-publish'){
    if(route!=='mcp-official')return;
    const cap=mcpCapability(id);if(!cap)return;
    mcpRelease(cap).published=action==='mcp-publish';save();render();toast(mcpRelease(cap).published?'官方能力已发布（演示）':'官方能力已暂停（演示）');return;
  }
  modal={type:action,id};render();
});
