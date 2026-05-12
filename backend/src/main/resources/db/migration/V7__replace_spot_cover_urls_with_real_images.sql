-- 使用可公开访问的 Wikimedia Commons 直链替换景点封面图，避免继续依赖本地 mock 图片。
UPDATE spot
SET cover_url = CASE id
    WHEN 101 THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E5%AE%BD%E7%AA%84%E5%B7%B7%E5%AD%90%20-%20panoramio.jpg'
    WHEN 102 THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E6%88%90%E9%83%BD%E6%AD%A6%E4%BE%AF%E7%A5%A0.jpg'
    WHEN 103 THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E6%88%90%E9%83%BD%E9%94%A6%E9%87%8C%E5%8F%A4%E8%A1%97.JPG'
    WHEN 104 THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E5%9B%9B%E5%B7%9D%20%E6%88%90%E9%83%BD%E5%A4%A7%E7%86%8A%E8%B2%93%E7%B9%81%E8%82%B2%E7%A0%94%E7%A9%B6%E5%9F%BA%E5%9C%B0%20%2840185686331%29.jpg'
    WHEN 105 THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E6%9D%9C%E7%94%AB%E8%8D%89%E5%A0%82.jpg'
    WHEN 201 THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E9%99%95%E8%A5%BF%E5%8E%86%E5%8F%B2%E5%8D%9A%E7%89%A9%E9%A6%86.jpg'
    WHEN 202 THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E5%A4%A7%E9%9B%81%E5%A1%94%E5%A4%9C%E6%99%AF.JPG'
    WHEN 203 THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E5%A4%A7%E5%94%90%E4%B8%8D%E5%A4%9C%E5%9F%8E%202.jpg'
    WHEN 204 THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E8%A5%BF%E5%AE%89%E5%9F%8E%E5%A2%99%E5%8D%97%E9%97%A8%E5%9F%8E%E6%A5%BC.jpg'
    ELSE cover_url
END,
updated_at = NOW()
WHERE id IN (101, 102, 103, 104, 105, 201, 202, 203, 204);
