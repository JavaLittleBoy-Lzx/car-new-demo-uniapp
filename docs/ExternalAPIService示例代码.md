# ExternalAPIService 示例代码

## 🔧 Spring Boot服务类实现

### 1. ExternalAPIService.java

```java
package com.parkingmanage.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.annotation.Resource;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
public class ExternalAPIService {

    @Resource
    private RestTemplate restTemplate;

    @Value("${external-api.ticket-list.url}")
    private String ticketListUrl;

    @Value("${external-api.ticket-list.timeout:10000}")
    private int timeout;

    @Value("#{'${external-api.ticket-list.park-codes}'.split(',')}")
    private List<String> parkCodes;

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 检查手机号是否在外部API的业主列表中（带缓存）
     */
    @Cacheable(value = "ownerTickets", key = "#phoneNumber")
    public boolean isOwnerInExternalAPI(String phoneNumber) {
        log.info("检查手机号是否在外部API中: {}", phoneNumber);
        
        try {
            List<Map<String, Object>> allTickets = getOnlineMonthTicketList();
            
            boolean found = allTickets.stream()
                .anyMatch(ticket -> phoneNumber.equals(ticket.get("userPhone")));
                
            log.info("外部API查询结果 - 手机号: {}, 找到: {}", phoneNumber, found);
            return found;
            
        } catch (Exception e) {
            log.error("调用外部API检查业主身份失败", e);
            return false;
        }
    }

    /**
     * 从外部API获取业主详细信息（带缓存）
     */
    @Cacheable(value = "ownerDetails", key = "#phoneNumber")
    public Map<String, Object> getOwnerInfoFromAPI(String phoneNumber) {
        log.info("从外部API获取业主详细信息: {}", phoneNumber);
        
        try {
            List<Map<String, Object>> allTickets = getOnlineMonthTicketList();
            
            Optional<Map<String, Object>> ownerTicket = allTickets.stream()
                .filter(ticket -> phoneNumber.equals(ticket.get("userPhone")))
                .findFirst();
                
            if (ownerTicket.isPresent()) {
                Map<String, Object> ticket = ownerTicket.get();
                return buildOwnerInfo(ticket);
            }
            
        } catch (Exception e) {
            log.error("从外部API获取业主信息失败", e);
        }
        
        // 返回基本信息
        return buildBasicOwnerInfo(phoneNumber);
    }

    /**
     * 异步方式检查业主身份（提高性能）
     */
    public CompletableFuture<Boolean> isOwnerInExternalAPIAsync(String phoneNumber) {
        return CompletableFuture.supplyAsync(() -> isOwnerInExternalAPI(phoneNumber));
    }

    /**
     * 获取所有月票列表
     */
    private List<Map<String, Object>> getOnlineMonthTicketList() {
        List<Map<String, Object>> allTickets = new ArrayList<>();
        int pageNum = 1;
        int pageSize = 100;
        boolean hasMore = true;
        int maxPages = 50; // 防止无限循环，最多查询50页
        
        log.info("开始获取外部API月票列表，停车场代码: {}", parkCodes);
        
        while (hasMore && pageNum <= maxPages) {
            try {
                Map<String, Object> params = buildRequestParams(pageNum, pageSize);
                String response = callExternalAPI(ticketListUrl, params);
                
                Map<String, Object> result = parseAPIResponse(response);
                List<Map<String, Object>> pageTickets = extractTicketsFromResponse(result);
                
                if (pageTickets != null && !pageTickets.isEmpty()) {
                    allTickets.addAll(pageTickets);
                    hasMore = pageTickets.size() >= pageSize;
                    pageNum++;
                    
                    log.debug("获取第{}页数据，本页{}条，累计{}条", pageNum - 1, pageTickets.size(), allTickets.size());
                } else {
                    hasMore = false;
                    log.info("第{}页没有数据，停止查询", pageNum);
                }
                
                // 添加短暂延迟，避免API调用过于频繁
                Thread.sleep(100);
                
            } catch (Exception e) {
                log.error("调用外部API第{}页失败", pageNum, e);
                hasMore = false;
            }
        }
        
        log.info("从外部API总共获取到{}条月票数据", allTickets.size());
        return allTickets;
    }

    /**
     * 构建API请求参数
     */
    private Map<String, Object> buildRequestParams(int pageNum, int pageSize) {
        Map<String, Object> params = new HashMap<>();
        params.put("pageNum", pageNum);
        params.put("pageSize", pageSize);
        params.put("parkCodeList", parkCodes);
        params.put("validStatus", 1);
        return params;
    }

    /**
     * 调用外部API
     */
    private String callExternalAPI(String url, Map<String, Object> params) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "ParkingManageSystem/1.0");
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(params, headers);
            
            log.debug("调用外部API: {}, 参数: {}", url, params);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                throw new RuntimeException("API调用失败，状态码：" + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("调用外部API异常: {}", e.getMessage());
            throw new RuntimeException("调用外部API失败", e);
        }
    }

    /**
     * 解析API响应
     */
    private Map<String, Object> parseAPIResponse(String response) {
        try {
            TypeReference<Map<String, Object>> typeRef = new TypeReference<Map<String, Object>>() {};
            return objectMapper.readValue(response, typeRef);
        } catch (Exception e) {
            log.error("解析API响应失败: {}", response, e);
            throw new RuntimeException("解析API响应失败", e);
        }
    }

    /**
     * 从响应中提取票据列表
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> extractTicketsFromResponse(Map<String, Object> result) {
        try {
            // 根据实际API响应结构调整
            if (result.containsKey("timePeriodList")) {
                return (List<Map<String, Object>>) result.get("timePeriodList");
            } else if (result.containsKey("data")) {
                return (List<Map<String, Object>>) result.get("data");
            } else {
                log.warn("API响应结构不符合预期: {}", result);
                return new ArrayList<>();
            }
        } catch (Exception e) {
            log.error("提取票据列表失败", e);
            return new ArrayList<>();
        }
    }

    /**
     * 构建业主信息
     */
    private Map<String, Object> buildOwnerInfo(Map<String, Object> ticket) {
        Map<String, Object> ownerInfo = new HashMap<>();
        
        // 从票据信息构建业主信息
        ownerInfo.put("ownername", ticket.get("userName"));
        ownerInfo.put("ownerphone", ticket.get("userPhone"));
        ownerInfo.put("carno", extractCarNumbers(ticket));
        ownerInfo.put("source", "external_api");
        ownerInfo.put("validStatus", ticket.get("validStatus"));
        ownerInfo.put("updateTime", ticket.get("updateTime"));
        ownerInfo.put("originalData", ticket); // 保存原始API数据
        
        // 可以根据需要添加更多字段映射
        
        return ownerInfo;
    }

    /**
     * 构建基本业主信息
     */
    private Map<String, Object> buildBasicOwnerInfo(String phoneNumber) {
        Map<String, Object> ownerInfo = new HashMap<>();
        ownerInfo.put("ownerphone", phoneNumber);
        ownerInfo.put("source", "external_api");
        ownerInfo.put("needSync", true);
        return ownerInfo;
    }

    /**
     * 提取车牌号信息
     */
    private String extractCarNumbers(Map<String, Object> ticket) {
        Object carNo = ticket.get("carNo");
        if (carNo != null) {
            return carNo.toString();
        }
        
        // 如果有多个车牌号字段，可以在这里处理
        StringBuilder carNumbers = new StringBuilder();
        
        // 示例：从ticket中提取所有可能的车牌号字段
        Arrays.asList("carNo", "plateNumber", "vehicleNo").forEach(field -> {
            if (ticket.containsKey(field) && ticket.get(field) != null) {
                if (carNumbers.length() > 0) {
                    carNumbers.append(",");
                }
                carNumbers.append(ticket.get(field).toString());
            }
        });
        
        return carNumbers.toString();
    }

    /**
     * 清除缓存（定时任务）
     */
    @CacheEvict(value = {"ownerTickets", "ownerDetails"}, allEntries = true)
    @Scheduled(fixedDelay = 300000) // 5分钟清除一次缓存
    public void clearCache() {
        log.info("清除外部API缓存");
    }

    /**
     * 手动刷新缓存
     */
    @CacheEvict(value = {"ownerTickets", "ownerDetails"}, allEntries = true)
    public void refreshCache() {
        log.info("手动刷新外部API缓存");
    }

    /**
     * 获取缓存统计信息（用于监控）
     */
    public Map<String, Object> getCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        // 这里可以添加缓存统计信息
        stats.put("cacheRefreshTime", new Date());
        stats.put("apiUrl", ticketListUrl);
        stats.put("parkCodes", parkCodes);
        return stats;
    }
}
```

### 2. 配置文件 application.yml

```yaml
# 外部API配置
external-api:
  ticket-list:
    url: https://openydt.yidianting.xin/Api/getOnlineMonthTicketList
    timeout: 10000
    retry-count: 3
    park-codes: 2KUG6XLU,OTHER_PARK_CODE  # 多个停车场代码用逗号分隔
    cache-duration: 300  # 缓存5分钟

# Redis缓存配置
spring:
  cache:
    type: redis
    redis:
      time-to-live: 300000  # 缓存5分钟
  redis:
    host: localhost
    port: 6379
    timeout: 3000

# RestTemplate超时配置
http:
  client:
    connection-timeout: 10000
    read-timeout: 30000
```

### 3. RestTemplate配置

```java
@Configuration
public class RestTemplateConfig {

    @Value("${http.client.connection-timeout:10000}")
    private int connectionTimeout;

    @Value("${http.client.read-timeout:30000}")
    private int readTimeout;

    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        
        // 配置超时时间
        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory();
        factory.setConnectTimeout(connectionTimeout);
        factory.setReadTimeout(readTimeout);
        
        restTemplate.setRequestFactory(factory);
        
        return restTemplate;
    }
}
```

### 4. 在WeChatAuthController中使用

```java
@Resource
private ExternalAPIService externalAPIService;

private Map<String, Object> determineUserRole(String phoneNumber, String openid) {
    // ... 前面的Butler和Ownerinfo查询逻辑 ...
    
    // 第三层：查询外部API
    try {
        if (externalAPIService.isOwnerInExternalAPI(phoneNumber)) {
            log.info("第三层查询成功：找到业主角色（外部API）");
            
            Map<String, Object> apiOwnerInfo = externalAPIService.getOwnerInfoFromAPI(phoneNumber);
            
            userInfo.put("role", "owner");
            userInfo.put("roleText", "业主");
            userInfo.put("userInfo", apiOwnerInfo);
            userInfo.put("permissions", getOwnerPermissions());
            userInfo.put("source", "external_api");
            userInfo.put("needSync", true);
            return userInfo;
        }
    } catch (Exception e) {
        log.warn("第三层查询失败：外部API调用异常", e);
        // API调用失败不影响后续查询
    }
    
    // ... 后续的Member查询逻辑 ...
}
```

## 🔧 使用建议

1. **性能优化**：使用缓存减少API调用频率
2. **异常处理**：API异常不应影响其他角色判断逻辑
3. **监控告警**：监控API调用成功率和响应时间
4. **数据同步**：考虑将外部API数据定期同步到本地数据库
5. **安全考虑**：确保API调用权限和网络安全

这样的实现既保证了数据的完整性，又具有良好的性能和可靠性！ 