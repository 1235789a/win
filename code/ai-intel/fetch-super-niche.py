#!/usr/bin/env python3

# ============================================
# 超细分垂直赛道挖掘 - 小众精准痛点
# ============================================

import subprocess
import json
import time

# ============================================
# 超细分职业/场景痛点（非常具体的小众市场）
# ============================================

SUPER_NICHE_KEYWORDS = [
    # 微商/电商
    ("朋友圈素材", "朋友圈素材生成"),
    ("小红书封面", "小红书封面设计"),
    ("电商水印", "批量图片水印"),
    
    # 律师/法务
    ("合同模板", "contract template legal"),
    ("法律文书", "legal document generator"),
    ("商标查询", "trademark lookup check"),
    
    # 摄影师/设计师
    ("RAW转JPG", "raw to jpg converter"),
    ("批量裁剪", "batch image crop resize"),
    ("图片去背景", "remove background image"),
    ("EXIF信息", "exif metadata editor"),
    
    # 财务/会计
    ("发票识别", "invoice ocr scanner"),
    ("账单整理", "receipt organizer"),
    ("汇率转换", "currency exchange rate"),
    ("工资条生成", "payroll slip generator"),
    
    # HR/招聘
    ("Offer模板", "offer letter template"),
    ("考勤统计", "attendance tracker"),
    ("面试评分", "interview scorecard"),
    
    # 餐饮/零售
    ("菜单设计", "menu design generator"),
    ("库存管理", "inventory management"),
    ("小票打印", "receipt printer template"),
    
    # 教育/培训
    ("证书生成", "certificate generator"),
    ("奖状模板", "award certificate template"),
    ("试卷排版", "exam paper formatter"),
    
    # 医疗/健康
    ("病历模板", "medical record template"),
    ("处方模板", "prescription template"),
    
    # 房产/装修
    ("装修预算", "renovation cost calculator"),
    ("房间面积", "room area calculator"),
    
    # 物流/运输
    ("快递单打印", "shipping label template"),
    ("批量发货", "batch shipping processor"),
    
    # 地产/中介
    ("房源海报", "property listing poster"),
    ("带看记录", "property visit tracker"),
    
    # 保险
    ("车险报价", "car insurance quote"),
    ("保单整理", "insurance policy tracker"),
    
    # 家政/保洁
    ("保洁清单", "cleaning checklist"),
    ("服务工单", "service work order"),
    
    # 宠物
    ("宠物档案", "pet health record"),
    ("疫苗记录", "vaccination tracker"),
    
    # 婚庆/摄影
    ("婚礼座位", "wedding seating chart"),
    ("宾客名单", "guest list manager"),
    
    # 房产中介
    ("房产话术", "real estate script"),
    
    # 微商/代购
    ("产品图册", "product catalog maker"),
    ("报价单", "quotation generator"),
    
    # 跨境电商
    ("亚马逊标题", "amazon product title"),
    ("产品描述", "product description writer"),
    
    # 外卖/餐饮
    ("外卖菜单", "food delivery menu"),
    ("价格牌", "price tag maker"),
    
    # 社区团购
    ("团购海报", "group buy poster"),
    ("团长通知", "group leader notification"),
    
    # 驾校/陪练
    ("约车系统", "driving lesson scheduler"),
    
    # 家教/培训
    ("课程表", "schedule maker"),
    
    # 快递/代收
    ("取件码", "pickup code generator"),
    
    # 社区物业
    ("通知公告", "notice poster"),
    
    # 微创业
    ("名片设计", "business card maker"),
    ("Logo生成", "logo generator"),
]

def fetch_github(keyword, min_stars=50):
    query = f"{keyword} stars:>{min_stars}"
    try:
        cmd = [
            "curl", "-s", "--connect-timeout", "10",
            f"https://api.github.com/search/repositories?q={query.replace(' ', '+')}&sort=stars&order=desc&per_page=10"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if "items" in data:
                return data["items"]
    except Exception as e:
        pass
    return []

def main():
    print("=" * 100)
    print("🎯 超细分垂直赛道挖掘 - 小众精准痛点")
    print("=" * 100)
    print(f"\n📊 共 {len(SUPER_NICHE_KEYWORDS)} 个超细分关键词\n")
    
    all_results = []
    
    for i, (pain_point, keyword) in enumerate(SUPER_NICHE_KEYWORDS, 1):
        print(f"[{i}/{len(SUPER_NICHE_KEYWORDS)}] 🔍 {pain_point}")
        
        projects = fetch_github(keyword, 50)
        
        if not projects:
            print("  ❌ 无结果")
            continue
        
        print(f"  ✅ 找到 {len(projects)} 个项目")
        
        for p in projects[:2]:  # 每个取TOP 2
            all_results.append({
                "pain_point": pain_point,
                "keyword": keyword,
                "name": p["name"],
                "stars": p["stargazers_count"],
                "description": p.get("description", ""),
                "url": p["html_url"],
                "language": p.get("language", ""),
            })
        
        time.sleep(0.3)
    
    print("\n" + "=" * 100)
    print(f"\n🎉 共抓取到 {len(all_results)} 个候选项目\n")
    
    # 按Stars排序
    all_results.sort(key=lambda x: -x["stars"])
    
    # 去重
    seen = set()
    unique_results = []
    for r in all_results:
        if r["name"] not in seen:
            seen.add(r["name"])
            unique_results.append(r)
    
    print(f"📦 去重后: {len(unique_results)} 个项目\n")
    
    # 输出所有结果
    print("=" * 100)
    print("🏆 全部超细分赛道项目\n")
    
    for i, r in enumerate(unique_results, 1):
        print(f"{i:2d}. {r['name']:<35} ⭐{r['stars']:<6} | 痛点: {r['pain_point']}")
        print(f"    📝 {r['description'][:70] if r['description'] else '无描述'}")
        print()
    
    # 按痛点分类
    print("\n" + "=" * 100)
    print("📂 按痛点分类\n")
    
    by_pain = {}
    for r in unique_results:
        pp = r["pain_point"]
        if pp not in by_pain:
            by_pain[pp] = []
        by_pain[pp].append(r)
    
    for pain, projects in sorted(by_pain.items(), key=lambda x: -sum(p["stars"] for p in x[1])):
        total_stars = sum(p["stars"] for p in projects)
        print(f"\n🔸 {pain} ({len(projects)}个项目, 总⭐{total_stars})")
        for p in projects[:3]:
            print(f"   - {p['name']} ⭐{p['stars']}")
    
    # 保存结果
    with open("/workspace/code/ai-intel/super-niche-projects.json", "w", encoding="utf-8") as f:
        json.dump(unique_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n\n✅ 结果已保存到: /workspace/code/ai-intel/super-niche-projects.json")

if __name__ == "__main__":
    main()
