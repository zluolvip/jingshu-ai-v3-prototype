/* 工作台只展示平台配置状态与客户端使用概览；使用事件为本地原型样例。 */
let homePeriod=30;
const homeUsageSamples=[
  [0,'陈运营','成功'],[0,'张管理员','成功'],[1,'陈运营','成功'],[2,'陈运营','失败'],
  [3,'张管理员','成功'],[4,'陈运营','成功'],[5,'陈运营','成功'],[6,'张管理员','成功'],
  [8,'陈运营','成功'],[10,'张管理员','成功'],[12,'陈运营','成功'],[13,'陈运营','失败'],
  [16,'张管理员','成功'],[18,'陈运营','成功'],[20,'张管理员','成功'],[22,'陈运营','成功'],
  [25,'陈运营','成功'],[27,'张管理员','成功']
];
function homeUsageEvents(){
  const installed=data.market.some(m=>m.id==='m1'&&m.subscription==='有效')&&data.agents.some(a=>a.id==='a1'&&a.status==='已发布');
  if(!installed)return [];
  return homeUsageSamples.filter(([days])=>days<homePeriod).map(([days,person,result])=>({days,person,result,agent:'智能补货分析 Agent'}));
}
function homeUsageTrend(events){
  const bins=homePeriod===7?7:10,counts=Array(bins).fill(0);
  for(const event of events){const index=Math.floor((homePeriod-1-event.days)*bins/homePeriod);if(index>=0&&index<bins)counts[index]++}
  const width=620,height=184,left=32,right=14,top=16,bottom=31,innerW=width-left-right,innerH=height-top-bottom,max=Math.max(1,...counts),x=i=>left+i*innerW/(bins-1),y=n=>top+innerH-n/max*innerH;
  const labels=counts.map((_,i)=>`<text x="${x(i)}" y="${height-6}" text-anchor="middle">${i===0?`${homePeriod} 天前`:i===bins-1?'今天':''}</text>`).join('');
  return `<svg class="wb-trend" viewBox="0 0 ${width} ${height}" role="img" aria-label="近 ${homePeriod} 天客户端调用趋势，共 ${events.length} 次">${[0,.5,1].map(f=>`<line x1="${left}" x2="${width-right}" y1="${y(max*f)}" y2="${y(max*f)}"/>`).join('')}<path d="M ${counts.map((count,i)=>`${x(i)} ${y(count)}`).join(' L ')}" fill="none" stroke="#70d4f1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${counts.map((count,i)=>`<circle cx="${x(i)}" cy="${y(count)}" r="3.5"><title>${count} 次调用</title></circle>`).join('')}${labels}</svg>`;
}
function homeRankingList(rows,total,emptyText){
  if(!rows.length)return `<div class="wb-empty">${emptyText}</div>`;
  return rows.map((item,index)=>{
    const share=total?Math.round(item.count/total*1000)/10:0;
    return `<div class="wb-ranking-item"><span class="wb-ranking-position">${String(index+1).padStart(2,'0')}</span><div class="wb-ranking-detail"><div class="wb-ranking-line"><strong>${esc(item.name)}</strong><span>${item.count} 次 <small>· ${share}%</small></span></div><div class="wb-ranking-track" role="img" aria-label="${esc(item.name)}，${item.count} 次调用，占比 ${share}%"><i style="width:${share}%"></i></div><small>${esc(item.meta)}</small></div></div>`;
  }).join('');
}
function homePage(){
  const publishedAgents=data.agents.filter(a=>a.status==='已发布'&&a.subscription!=='到期');
  const installed=data.market.filter(m=>m.subscription==='有效');
  const usableEmployees=data.employees.filter(e=>e.state==='正常'&&publishedAgents.some(a=>a.employees.includes(e.name)));
  const authorizedErps=data.erps.filter(e=>e.state==='已授权');
  const publishedTools=MCP_CATALOG.filter(cap=>mcpRelease(cap).published);
  const readyTools=publishedTools.filter(cap=>authorizedStores().some(store=>mcpReadiness(cap,store).ok));
  const attention=data.sync.filter(item=>item.status!=='成功');
  const events=homeUsageEvents(),successful=events.filter(event=>event.result==='成功').length;
  const successRate=events.length?`${Math.round(successful/events.length*100)}%`:'—';
  const people=usableEmployees.map(employee=>({name:employee.name,meta:employee.department||employee.role,count:events.filter(event=>event.person===employee.name).length})).sort((a,b)=>b.count-a.count);
  const agentUsage=publishedAgents.map(agent=>({name:agent.name,meta:`${agent.version} · ${agent.kind}`,count:events.filter(event=>event.agent===agent.name).length})).sort((a,b)=>b.count-a.count);
  const installedAgents=publishedAgents.filter(agent=>installed.some(m=>m.agentId===agent.id||m.id==='m1'&&agent.id==='a1'));
  return `${heading('工作台','查看已安装 Agent、员工使用概况与数据连接状态。',btn('管理 Agent','nav','agents','secondary'))}
    <section class="wb-hero" aria-label="企业 AI 服务概况">
      <div class="wb-hero-main"><div class="wb-eyebrow">WORKSPACE / 远航贸易</div><h2>企业 AI 能力总览</h2><p>企业在平台侧安装和发布 Agent。员工在独立客户端发起任务，网页集中管理可用能力与数据授权。</p><div class="wb-hero-actions">${btn('查看应用市场','nav','market','')}${btn('查看数据平台','nav','data','secondary')}</div></div>
      <div class="wb-hero-summary"><span>可供客户端使用</span><strong>${installedAgents.length}<small> 个 Agent</small></strong><p>${usableEmployees.length} 名员工已获使用权限</p><div class="wb-summary-track"><i style="width:${Math.min(100,installedAgents.length/Math.max(1,installed.length)*100)}%"></i></div><small>已发布且订阅有效</small></div>
    </section>
    <section class="wb-kpis" aria-label="工作台关键指标">
      <div class="card wb-kpi"><span>已发布 Agent</span><strong>${publishedAgents.length}</strong><small>由平台或企业发布版本</small></div>
      <div class="card wb-kpi"><span>活跃使用员工</span><strong>${new Set(events.map(event=>event.person)).size}</strong><small>近 ${homePeriod} 天 · 客户端样例</small></div>
      <div class="card wb-kpi"><span>客户端调用</span><strong>${events.length}</strong><small>近 ${homePeriod} 天 · 演示统计</small></div>
      <div class="card wb-kpi ${attention.length?'wb-kpi-warn':''}"><span>同步需关注</span><strong>${attention.length}</strong><small>部分成功或失败的业务域</small></div>
    </section>
    <section class="wb-usage-section" aria-label="客户端使用概况">
      <div class="wb-section-head"><div><div class="wb-eyebrow">CLIENT ACTIVITY</div><h2>客户端使用概况</h2><p>查看员工是否开始使用已安装的 Agent，以及调用是否完成。</p></div><div class="wb-period" role="group" aria-label="统计时间范围"><button type="button" data-action="home-period" data-id="7" aria-pressed="${homePeriod===7}" class="${homePeriod===7?'active':''}">近 7 天</button><button type="button" data-action="home-period" data-id="30" aria-pressed="${homePeriod===30}" class="${homePeriod===30?'active':''}">近 30 天</button></div></div>
      <div class="wb-usage-note">客户端调用与执行结果为原型样例，尚未接入真实客户端上报；“执行成功”不代表业务建议已被接受。</div>
      <div class="card wb-chart-card"><div class="wb-card-head"><div><span class="wb-eyebrow">USAGE TREND</span><h3>调用趋势</h3></div><span>${events.length} 次调用</span></div>${homeUsageTrend(events)}<div class="wb-chart-foot"><span>活跃员工 ${new Set(events.map(event=>event.person)).size} 人</span><span>执行成功率 ${successRate}</span></div></div>
      <div class="wb-ranking-grid"><div class="card wb-ranking-card"><div class="wb-card-head"><div><span class="wb-eyebrow">AGENT RANKING</span><h3>Agent 使用排行</h3></div><span>共 ${agentUsage.length} 个已发布</span></div><p class="wb-ranking-caption">按客户端调用次数排序，包含暂未被使用的 Agent。</p>${homeRankingList(agentUsage,events.length,'暂无已发布 Agent。')}<div class="wb-ranking-footer">${link('查看 Agent 中心','nav','agents')}</div></div>
        <div class="card wb-ranking-card"><div class="wb-card-head"><div><span class="wb-eyebrow">EMPLOYEE RANKING</span><h3>员工使用排名</h3></div><span>共 ${people.length} 名可用员工</span></div><p class="wb-ranking-caption">按客户端调用次数排序，仅统计有 Agent 使用权的员工。</p>${homeRankingList(people,events.length,'当前没有可用员工。')}<div class="wb-ranking-footer">${link('管理员工权限','settings-tab','permissions')}</div></div></div>
    </section>
    <section class="wb-services" aria-label="平台服务状态"><div class="wb-section-head"><div><div class="wb-eyebrow">PLATFORM READINESS</div><h2>平台服务状态</h2><p>这些配置决定客户端可发现和使用哪些能力。</p></div></div><div class="wb-service-grid">
      <div class="card wb-service"><div class="wb-service-icon">${icon('agents')}</div><h3>Agent 发布</h3><strong>${publishedAgents.length} 个版本已发布</strong><p>${installed.length} 个应用订阅有效</p>${link('查看 Agent 中心','nav','agents')}</div>
      <div class="card wb-service"><div class="wb-service-icon">${icon('data')}</div><h3>数据连接</h3><strong>${authorizedErps.length} / ${data.erps.length} 个 ERP 已授权</strong><p>${attention.length?`${attention.length} 项同步需要检查`:'同步状态正常'}</p>${link('查看数据平台','nav','data')}</div>
      <div class="card wb-service"><div class="wb-service-icon">${icon('mcp')}</div><h3>官方 MCP</h3><strong>${readyTools.length} / ${publishedTools.length} 项数据就绪</strong><p>工具由平台统一发布，调用仍按企业权限校验。</p>${link('查看 MCP 中心','nav','mcp')}</div>
    </div></section>`;
}
