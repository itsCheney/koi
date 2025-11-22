---
title: "在iptables中实现StosVPN的流量反射"
pubDate: "2025-11-03" # 推荐使用 YYYY-MM-DD

#description: ""
updatedDate: "2025-11-23"
heroImage: "/images/blog/post-hero.jpg"
draft: false
unlisted: false

tags:
  - '网络'
  - '技术向'
---

在网络上有着很多关于StosVPN原理的文章，本文在此不做赘述。

---

首先我们需要明确的是，iptables 的 NAT表是Stateful的，它依赖于 conntrack 才能工作。如果我们在 iptables 的 raw 表中使用了 -j NOTRACK，那么 nat 表将不会处理该数据包，DNAT 和以及SNAT 都会失效。

因此，我们无法在iptables中实现nftables中的Stateless NAT。所以在iptables中实现时，这将是有状态的，即我们会省略 notrack 的部分，转而使用 nat 表。

我们使用两条规则，一条在 PREROUTING 链（用于DNAT），另一条在 POSTROUTING 链（用于SNAT）。

```bash

# 1. DNAT 匹配从 192.168.123.3 发往 10.7.0.1 的包，将其目标地址改为 192.168.123.3
iptables -t nat -A PREROUTING -s 192.168.123.3 -d 10.7.0.1 -j DNAT --to-destination 192.168.123.3

# 2. SNAT 匹配经过 DNAT 后的包 (s:192.168.123.3, d:192.168.123.3)，将其源地址改为 10.7.0.1
iptables -t nat -A POSTROUTING -s 192.168.123.3 -d 192.168.123.3 -j SNAT --to-source 10.7.0.1

```

这两条规则共同将 192.168.123.3 -> 10.7.0.1 的流量“反射”回 192.168.123.3，并伪装源地址为 10.7.0.1。

### 总结
* iptables规则为： A -> B 进，在 nat PREROUTING 变为 A -> A，然后在 nat POSTROUTING 变为 B -> A 出。整个过程存在conntrack。

对于 SideStore/JIT ，使用 iptables 的Stateful NAT也可以正常工作。

*Tips：在使用misaka等工具修改了设备的MobileGestalt后，需要使用idevice_pair重新生成Pairing File并在SideStore中Reset后重新导入，否则会导致无法续签应用。*