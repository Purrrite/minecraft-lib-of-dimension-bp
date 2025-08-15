import java.util.*;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.entity.ArmorStand;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitRunnable;

public class TagAssigner {

  private final Set<UUID> musicCoolDown = new HashSet<>();
  private int tickCounter = 0;

  public TagAssigner() {
    // 1틱마다 실행
    new BukkitRunnable() {
      @Override
      public void run() {
        tickCounter++;

        if (tickCounter % 2 == 0) {
          assignTagsToPlayers(); // 2틱마다 실행
          musicSystemTick(); // Java에 맞춰 직접 구현 필요
        }

        if (tickCounter >= 200) {
          tickCounter = 0;
        }
      }
    }.runTaskTimer(MyPlugin.getInstance(), 0L, 1L); // 1틱 주기
  }

  private void assignTagsToPlayers() {
    World world = Bukkit.getWorld("world");
    if (world == null) return;

    List<ArmorStand> armorStands = world.getEntitiesByClass(ArmorStand.class);

    for (Player player : Bukkit.getOnlinePlayers()) {
      Set<String> playerTags = player.getScoreboardTags();

      if (playerTags.isEmpty()) {
        player.addScoreboardTag("__cleared");
      }

      Location playerLoc = player.getLocation();

      for (ArmorStand stand : armorStands) {
        Location standLoc = stand.getLocation();
        String nameTag = stand.getCustomName();
        if (nameTag != null) nameTag = nameTag.trim();

        // 높이 조건
        if (standLoc.getY() + 3.1 >= playerLoc.getY()
            && playerLoc.getY() >= standLoc.getY() + 3
            && playerLoc.getBlockX() == standLoc.getBlockX()
            && playerLoc.getBlockZ() == standLoc.getBlockZ()) {

          if (nameTag == null || nameTag.isEmpty()) continue;

          if (nameTag.equals("removetag")) {
            if (!playerTags.contains("__cleared")) {
              playerTags.forEach(
                  tag -> {
                    if (!tag.equals("__cleared")) {
                      player.removeScoreboardTag(tag);
                    }
                  });
              player.addScoreboardTag("__cleared");
              musicCoolDown.remove(player.getUniqueId());
              Bukkit.getLogger().info(player.getName() + "의 태그 제거됨");
            }
            continue;
          }

          if (nameTag.equals("stopsound")) {
            if (!playerTags.contains("__cleared")) {
              playerTags.forEach(
                  tag -> {
                    if (!tag.equals("__cleared")) {
                      player.removeScoreboardTag(tag);
                    }
                  });
              player.addScoreboardTag("__cleared");
              player.stopSound(org.bukkit.SoundCategory.MASTER); // 전체 사운드 중지
              musicCoolDown.remove(player.getUniqueId());
              Bukkit.getLogger().info(player.getName() + "의 사운드 정지 및 태그 제거됨");
            }
            continue;
          }

          // 일반 태그 부여
          if (!playerTags.contains(nameTag)) {
            player.addScoreboardTag(nameTag);
            player.removeScoreboardTag("__cleared");
            musicCoolDown.remove(player.getUniqueId());
            Bukkit.getLogger().info("태그 '" + nameTag + "'를 " + player.getName() + "에게 부여함");
          }
        }
      }
    }
  }

  // JS의 musicSystemTick()에 해당하는 로직을 Java로 구현 필요
  private void musicSystemTick() {
    // 직접 구현
  }
}
